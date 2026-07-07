import { parse } from "csv-parse";

export interface RoomTypeCsvRow {
  name: string; description?: string; max_occupancy: string;
  base_price_ngn: string; quantity: string; amenities?: string;
}

export function parseRoomTypeCsv(rawCsv: string): Promise<RoomTypeCsvRow[]> {
  return new Promise((resolve, reject) => {
    const records: RoomTypeCsvRow[] = [];
    const parser = parse({
      columns: true, trim: true, skip_empty_lines: true, bom: true,
      cast: (value) => (typeof value === "string" ? value.trim() : value),
    });

    parser.on("data", (row: RoomTypeCsvRow) => records.push(row));
    parser.on("end",   () => resolve(records));
    parser.on("error", (err) => reject(err));
    parser.write(rawCsv);
    parser.end();
  });
}