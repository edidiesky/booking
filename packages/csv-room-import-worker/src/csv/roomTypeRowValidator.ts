export interface RowError { row: number; reason: string; }
export interface ValidatedRow {
  name: string; description?: string; maxOccupancy: number;
  basePriceNgn: number; quantity: number; amenities: string[];
}
interface RoomTypeCsvRowLike {
  name: string; description?: string; max_occupancy: string; base_price_ngn: string; quantity: string; amenities?: string;
}

export function validateRoomTypeRow(row: RoomTypeCsvRowLike, rowNum: number):
  { ok: true; data: ValidatedRow } | { ok: false; error: RowError } {

  const maxOccupancy = Number(row.max_occupancy);
  const basePriceNgn = Number(row.base_price_ngn);
  const quantity     = Number(row.quantity);

  if (!row.name?.trim())                                 return { ok: false, error: { row: rowNum, reason: "name is required" } };
  if (!Number.isFinite(maxOccupancy) || maxOccupancy < 1) return { ok: false, error: { row: rowNum, reason: "max_occupancy must be a positive number" } };
  if (!Number.isFinite(basePriceNgn) || basePriceNgn < 0) return { ok: false, error: { row: rowNum, reason: "base_price_ngn must be a non-negative number" } };
  if (!Number.isFinite(quantity) || quantity < 1)         return { ok: false, error: { row: rowNum, reason: "quantity must be a positive number" } };

  return {
    ok: true,
    data: {
      name: row.name.trim(),
      description: row.description?.trim(),
      maxOccupancy, basePriceNgn, quantity,
      amenities: row.amenities ? row.amenities.split(",").map((a) => a.trim()).filter(Boolean) : [],
    },
  };
}