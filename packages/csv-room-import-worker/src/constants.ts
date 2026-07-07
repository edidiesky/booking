export const MAX_CSV_BYTES = 20 * 1024 * 1024;
export const MAX_ROWS      = 5_000;

export const ROOM_TYPE_CSV_TEMPLATE = [
  "name", "description", "max_occupancy", "base_price_ngn", "quantity", "amenities",
] as const;