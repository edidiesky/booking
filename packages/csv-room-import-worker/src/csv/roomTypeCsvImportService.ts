import { propertyRepository, jobRepository } from "@booking/shared";
import { downloadCsv } from "./csvDownloader";
import { validateCsvSize } from "./csvSizeValidator";
import { validateCsvHeaders } from "./csvHeaderValidator";
import { parseRoomTypeCsv } from "./csvStreamParser";
import { validateRoomTypeRow, type RowError } from "./roomTypeRowValidator";

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

  for (let i = 0; i < rows.length; i++) {
    const validated = validateRoomTypeRow(rows[i], i + 2);
    if (!validated.ok) {
      errors.push(validated.error);
      continue;
    }

    try {
      await propertyRepository.createRoomType({
        propertyId,
        tenantId,
        ...validated.data,
      });
      succeeded++;
    } catch (err) {
      errors.push({ row: i + 2, reason: (err as Error).message });
    }

    if (i % 10 === 0 || i === rows.length - 1) {
      await setState(
        "processing",
        15 + Math.round(((i + 1) / rows.length) * 80),
        { stage: "importing" },
        jobId,
      );
    }
  }

  const result: ImportResult = { succeeded, failed: errors.length, errors };
  await setState("done", 100, { result }, jobId);
  return result;
}
