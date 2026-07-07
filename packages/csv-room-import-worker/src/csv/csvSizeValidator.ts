import { logger } from "@booking/shared";
import { MAX_CSV_BYTES, MAX_ROWS } from "../constants";

export function validateCsvSize(rawCsv: string, jobId: string): void {
  const byteSize = Buffer.byteLength(rawCsv, "utf8");
  const rowCount = (rawCsv.match(/\n/g) || []).length;

  if (byteSize > MAX_CSV_BYTES) {
    logger.warn("csv_size_exceeded", { event: "csv_size_exceeded", jobId, byteSize, limit: MAX_CSV_BYTES });
    throw new Error(`File size exceeds ${MAX_CSV_BYTES / 1024 / 1024}MB limit`);
  }
  if (rowCount > MAX_ROWS) {
    logger.warn("csv_row_count_exceeded", { event: "csv_row_count_exceeded", jobId, rowCount, limit: MAX_ROWS });
    throw new Error(`Row count exceeds the ${MAX_ROWS} limit per upload`);
  }
}