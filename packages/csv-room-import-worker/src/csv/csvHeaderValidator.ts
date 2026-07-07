import { logger } from "@booking/shared";
import { ROOM_TYPE_CSV_TEMPLATE } from "../constants";
import { RoomTypeCsvRow } from "./csvStreamParser";

export function validateCsvHeaders(records: RoomTypeCsvRow[], jobId: string): void {
  const headers = Object.keys(records[0] ?? {});
  const missing = ROOM_TYPE_CSV_TEMPLATE.filter((h) => !headers.includes(h));

  if (missing.length > 0) {
    logger.warn("csv_header_mismatch", { event: "csv_header_mismatch", jobId, missing, received: headers });
    throw new Error(`CSV header mismatch. Missing required columns: ${missing.join(", ")}`);
  }
}