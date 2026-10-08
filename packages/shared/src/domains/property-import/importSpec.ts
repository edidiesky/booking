
export const PROPERTY_IMPORT_COLUMNS = [
  "property_ref",
  "property_name",
  "property_type",
  "property_description",
  "street",
  "city",
  "state",
  "country",
  "latitude",
  "longitude",
  "check_in_time",
  "check_out_time",
  "property_amenities",
  "room_ref",
  "room_name",
  "room_description",
  "max_occupancy",
  "base_price_ngn",
  "quantity",
  "room_amenities",
] as const;

export type PropertyImportColumn = (typeof PROPERTY_IMPORT_COLUMNS)[number];

export const PROPERTY_IMPORT_LIMITS = {
  maxFileBytes: 5 * 1024 * 1024,
  maxRows: 2_000,
  maxProperties: 200,
  maxRoomsPerProperty: 50,
  maxStoredErrors: 1_000,
} as const;

export const PROPERTY_IMPORT_QUEUE = {
  exchange: "property.import",
  queue: "property.import.queue",
  routingKey: "process",
} as const;


export function importFolderForTenant(tenantId: string): string {
  return `tenants/${tenantId}/imports/`;
}

export function isImportFileForTenant(publicId: string, tenantId: string): boolean {
  return (
    publicId.startsWith(importFolderForTenant(tenantId)) &&
    publicId.endsWith(".csv") &&
    !publicId.includes("..") &&
    /^[A-Za-z0-9/_.-]+$/.test(publicId)
  );
}