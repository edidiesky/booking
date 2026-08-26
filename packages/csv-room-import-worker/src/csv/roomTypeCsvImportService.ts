import { propertyRepository, jobRepository, checkpointRepository } from "@booking/shared";
import { downloadCsv } from "./csvDownloader";
import { validateCsvSize } from "./csvSizeValidator";
import { validateCsvHeaders } from "./csvHeaderValidator";
import { parseRoomTypeCsv } from "./csvStreamParser";
import { validateRoomTypeRow, type RowError, type ValidatedRow } from "./roomTypeRowValidator";

const JOB_TYPE = "csv_room_import";
const CHUNK_SIZE = 500;

interface ImportInput {
  jobId: string;
  propertyId: string;
  tenantId: string;
  fileUrl: string;
}
interface ImportResult {
  succeeded: number;
  failed: number;
  errors: RowError[];
}
interface ImportCursor {
  rowOffset: number;
}

const setState = (
  state: "processing" | "done" | "error",
  progress: number,
  extra: Record<string, unknown> = {},
  jobId: string,
) =>
  jobRepository.setState(JOB_TYPE, jobId, {
    jobId,
    jobType: JOB_TYPE,
    state,
    progress,
    updatedAt: new Date().toISOString(),
    ...extra,
  });

/**
 * Claims the durable checkpoint for this job. Returns null if another
 * worker instance currently holds a live claim, caller should back off
 * (nack/requeue), not retry in a tight loop.
 *
 * On a fresh job this starts at rowOffset 0. On a resumed job (worker
 * crashed and the message was redelivered, or the lease expired and
 * this or another instance is retrying) this returns the cursor from
 * the last successfully-committed chunk, so processing skips rows
 * already durably confirmed, not just rows shown as "done" in the
 * ephemeral Redis progress state.
 */
async function claimOrBackoff(
  jobId: string,
  tenantId: string,
  workerInstanceId: string,
): Promise<{ resumeFromRowOffset: number } | null> {
  await checkpointRepository.ensureExists(JOB_TYPE, jobId, tenantId);
  const checkpoint = await checkpointRepository.claim(JOB_TYPE, jobId, workerInstanceId);
  if (!checkpoint) return null;
  const cursor = checkpoint.cursor as Partial<ImportCursor>;
  return { resumeFromRowOffset: cursor.rowOffset ?? 0 };
}

export async function runRoomTypeCsvImport(
  input: ImportInput,
  workerInstanceId: string,
): Promise<ImportResult> {
  const { jobId, propertyId, tenantId, fileUrl } = input;

  const claim = await claimOrBackoff(jobId, tenantId, workerInstanceId);
  if (!claim) {
    throw new Error(
      `csv_room_import job ${jobId} is already claimed by another worker instance, backing off`,
    );
  }
  const { resumeFromRowOffset } = claim;

  await setState("processing", 5, { stage: "downloading" }, jobId);
  const rawCsv = await downloadCsv(fileUrl, jobId);
  validateCsvSize(rawCsv, jobId);

  await setState("processing", 15, { stage: "parsing" }, jobId);
  const rows = await parseRoomTypeCsv(rawCsv);
  validateCsvHeaders(rows, jobId);

  const errors: RowError[] = [];
  let succeeded = 0;

  const good: Array<{ rowNum: number; data: ValidatedRow }> = [];

  for (let i = 0; i < rows.length; i++) {
    const validated = validateRoomTypeRow(rows[i], i + 2);
    if (!validated.ok) {
      errors.push(validated.error);
      continue;
    }
    good.push({ rowNum: i + 2, data: validated.data });
  }

  try {
    for (let start = resumeFromRowOffset; start < good.length; start += CHUNK_SIZE) {
      const chunk = good.slice(start, start + CHUNK_SIZE);
      try {
        await propertyRepository.createRoomTypesBulk(
          chunk.map(({ data }) => ({ propertyId, tenantId, ...data })),
        );
        succeeded += chunk.length;
      } catch (err) {
        // Whole chunk failed (e.g. one row violates a constraint)
        for (const { rowNum, data } of chunk) {
          try {
            await propertyRepository.createRoomTypesBulk([{ propertyId, tenantId, ...data }]);
            succeeded++;
          } catch (rowErr) {
            errors.push({ row: rowNum, reason: (rowErr as Error).message });
          }
        }
      }

      const newOffset = start + chunk.length;
      const checkpointRow = await checkpointRepository.advance(
        JOB_TYPE,
        jobId,
        workerInstanceId,
        { rowOffset: newOffset } satisfies ImportCursor,
        chunk.length,
      );
      if (!checkpointRow) {
      
        throw new Error(
          `csv_room_import job ${jobId} lost its checkpoint claim mid-run, ` +
          `another worker instance has taken over`,
        );
      }

      await setState(
        "processing",
        15 + Math.round((newOffset / Math.max(good.length, 1)) * 80),
        { stage: "importing" },
        jobId,
      );
    }

    const result: ImportResult = { succeeded, failed: errors.length, errors };
    await checkpointRepository.complete(JOB_TYPE, jobId, workerInstanceId);
    await setState("done", 100, { result }, jobId);
    return result;
  } catch (err) {
    await checkpointRepository.fail(
      JOB_TYPE,
      jobId,
      workerInstanceId,
      err instanceof Error ? err.message : String(err),
    );
    throw err;
  }
}