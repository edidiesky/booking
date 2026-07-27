import { esClient, PROPERTY_INDEX, type ESPropertyDoc } from "./esClient";
import { logger } from "@booking/shared";

interface PropertySyncPayload {
  propertyId:    string;
  tenantId:      string;
  name?:         string;
  description?:  string;
  city?:         string;
  propertyType?: string;
  amenities?:    string[];
  fromPriceNgn?: number | null;
  latitude?:     number | null;
  longitude?:    number | null;
  createdAt?:    string;
  updatedAt?:    string;
}

function toLocation(lat: unknown, lon: unknown): { lat: number; lon: number } | null {
  if (lat == null || lon == null) return null;
  return { lat: Number(lat), lon: Number(lon) };
}

export const propertyHandlers: Record<string, (payload: Record<string, unknown>) => Promise<void>> = {
  "property.created": async (raw) => {
    const p = raw as unknown as PropertySyncPayload;
    const doc: ESPropertyDoc = {
      propertyId:    p.propertyId,
      tenantId:      p.tenantId,
      name:          p.name ?? "",
      description:   p.description,
      city:          p.city ?? "",
      propertyType:  p.propertyType ?? "",
      amenities:     p.amenities ?? [],
      fromPriceNgn:  p.fromPriceNgn ?? null,
      location:      toLocation(p.latitude, p.longitude),
      isDeleted:     false,
      createdAt:     p.createdAt,
      updatedAt:     p.createdAt,
    };
    await esClient.index({ index: PROPERTY_INDEX, id: doc.propertyId, document: doc });
    logger.info("es_property_upserted_on_create", { event: "es_property_upserted_on_create", propertyId: doc.propertyId, tenantId: doc.tenantId });
  },

  "property.updated": async (raw) => {
    const p = raw as unknown as PropertySyncPayload;
    const fields: Partial<ESPropertyDoc> = {};
    if (p.name         !== undefined) fields.name = p.name;
    if (p.description   !== undefined) fields.description = p.description;
    if (p.city          !== undefined) fields.city = p.city;
    if (p.propertyType  !== undefined) fields.propertyType = p.propertyType;
    if (p.amenities     !== undefined) fields.amenities = p.amenities;
    if (p.fromPriceNgn  !== undefined) fields.fromPriceNgn = p.fromPriceNgn;
    if (p.latitude !== undefined || p.longitude !== undefined) {
      fields.location = toLocation(p.latitude, p.longitude);
    }
    if (p.updatedAt !== undefined) fields.updatedAt = p.updatedAt;

    await esClient.update({ index: PROPERTY_INDEX, id: p.propertyId, doc: fields, doc_as_upsert: true });
    logger.info("es_property_updated", { event: "es_property_updated", propertyId: p.propertyId });
  },

  // Soft delete, matches Postgres's own status-based convention, not a
  // hard delete, avoids a delete-then-recreate race against an
  // in-flight update event for the same property still on the queue.
  "property.deleted": async (raw) => {
    const { propertyId } = raw as unknown as { propertyId: string };
    await esClient.update({ index: PROPERTY_INDEX, id: propertyId, doc: { isDeleted: true }, doc_as_upsert: false });
    logger.info("es_property_soft_deleted", { event: "es_property_soft_deleted", propertyId });
  },
};