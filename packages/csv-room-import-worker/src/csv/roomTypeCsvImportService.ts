import { propertyRepository, jobRepository } from "@booking/shared";
import { downloadCsv } from "./csvDownloader";
import { validateCsvSize } from "./csvSizeValidator";
import { validateCsvHeaders } from "./csvHeaderValidator";
import { parseRoomTypeCsv } from "./csvStreamParser";
import { validateRoomTypeRow, type RowError, type ValidatedRow } from "./roomTypeRowValidator";

const JOB_TYPE = "csv_room_import";

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

export async function runRoomTypeCsvImport(
  input: ImportInput,
): Promise<ImportResult> {
  const { jobId, propertyId, tenantId, fileUrl } = input;

  await setState("processing", 5, { stage: "downloading" }, jobId);
  const rawCsv = await downloadCsv(fileUrl, jobId);
  validateCsvSize(rawCsv, jobId);

  await setState("processing", 15, { stage: "parsing" }, jobId);
  const rows = await parseRoomTypeCsv(rawCsv);
  validateCsvHeaders(rows, jobId);

  const errors: RowError[] = [];
  let succeeded = 0;

  // Validate everything up front (pure, no DB access), keep the row number
  // attached so DB-stage errors can still be reported per row later.
  const good: Array<{ rowNum: number; data: ValidatedRow }> = [];

  for (let i = 0; i < rows.length; i++) {
    const validated = validateRoomTypeRow(rows[i], i + 2);
    if (!validated.ok) {
      errors.push(validated.error);
      continue;
    }
    good.push({ rowNum: i + 2, data: validated.data });
  }

  // Bulk-insert in chunks: one round trip per chunk instead of one per row.
  const CHUNK_SIZE = 500;
  for (let start = 0; start < good.length; start += CHUNK_SIZE) {
    const chunk = good.slice(start, start + CHUNK_SIZE);
    try {
      await propertyRepository.createRoomTypesBulk(
        chunk.map(({ data }) => ({ propertyId, tenantId, ...data })),
      );
      succeeded += chunk.length;
    } catch (err) {
      // Whole chunk failed (e.g. one row violates a constraint), fall back
      // to per-row inserts for just this chunk so we can attribute the
      // failure to the specific row instead of losing the whole chunk.
      for (const { rowNum, data } of chunk) {
        try {
          await propertyRepository.createRoomType({ propertyId, tenantId, ...data });
          succeeded++;
        } catch (rowErr) {
          errors.push({ row: rowNum, reason: (rowErr as Error).message });
        }
      }
    }

    await setState(
      "processing",
      15 + Math.round(((start + chunk.length) / Math.max(good.length, 1)) * 80),
      { stage: "importing" },
      jobId,
    );
  }

  const result: ImportResult = { succeeded, failed: errors.length, errors };
  await setState("done", 100, { result }, jobId);
  return result;
}