import { query, queryOne } from "@booking/shared";
import { AppError } from "../../utils/AppError";
import {
  parseImportImageFilename,
  importImageFilenameExample,
} from "../../utils/parseImportImageFilename";
import logger from "../../utils/logger";

export interface ImageAttachmentInput {
  fileName: string;
  url: string;
}

export interface ImageAttachmentResultItem {
  fileName: string;
  url: string;
  status: "linked" | "unmatched" | "invalid_url" | "invalid_name";
  propertyRef?: string;
  roomRef?: string;
  position?: number;
  roomTypeId?: string;
  propertyId?: string;
  message?: string;
}

export interface AttachRoomImagesResult {
  linked: number;
  unmatched: number;
  results: ImageAttachmentResultItem[];
  example: string;
}

interface RoomTypeHit {
  id: string;
  property_id: string;
  images: string[] | null;
  property_ref: string;
  room_ref: string;
}

function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function mergeImagesByPosition(
  existing: string[],
  updates: Map<number, string>,
): string[] {
  const maxExisting = existing.length;
  const maxUpdate = updates.size ? Math.max(...updates.keys()) : 0;
  const maxPos = Math.max(maxExisting, maxUpdate);

  const sparse: (string | undefined)[] = [];
  for (let i = 1; i <= maxPos; i++) {
    if (updates.has(i)) sparse[i - 1] = updates.get(i);
    else if (existing[i - 1]) sparse[i - 1] = existing[i - 1];
  }
  return sparse.filter((u): u is string => Boolean(u));
}

async function findRoomTypeByRefs(
  tenantId: string,
  propertyRef: string,
  roomRef: string,
  batchId?: string,
): Promise<RoomTypeHit | null> {
  const params: unknown[] = [tenantId, propertyRef, roomRef];
  let batchClause = "";
  if (batchId) {
    params.push(batchId);
    batchClause = `AND rt.import_batch_id = $4 AND p.import_batch_id = $4`;
  }

  return queryOne<RoomTypeHit>(
    `SELECT rt.id, rt.property_id, rt.images,
            p.external_ref AS property_ref, rt.external_ref AS room_ref
     FROM room_types rt
     JOIN properties p ON p.id = rt.property_id
     WHERE p.tenant_id = $1
       AND rt.tenant_id = $1
       AND lower(p.external_ref) = lower($2)
       AND lower(rt.external_ref) = lower($3)
       ${batchClause}
     LIMIT 1`,
    params,
  );
}

export async function attachRoomImages(input: {
  tenantId: string;
  attachments: ImageAttachmentInput[];
  batchId?: string;
}): Promise<AttachRoomImagesResult> {
  const { tenantId, attachments, batchId } = input;

  if (!attachments.length) {
    throw AppError.badRequest("Please kindly add at least one image.");
  }
  if (attachments.length > 100) {
    throw AppError.badRequest("Please kindly ensure that the upload is at most 100 images per request.");
  }

  const results: ImageAttachmentResultItem[] = [];
  const pending = new Map<
    string,
    { hit: RoomTypeHit; positions: Map<number, string> }
  >();

  for (const att of attachments) {
    if (!isHttpUrl(att.url)) {
      results.push({
        fileName: att.fileName,
        url: att.url,
        status: "invalid_url",
        message: "Image URL must be http(s).",
      });
      continue;
    }

    const parsed = parseImportImageFilename(att.fileName);
    if (!parsed) {
      results.push({
        fileName: att.fileName,
        url: att.url,
        status: "invalid_name",
        message: `Name must look like ${importImageFilenameExample()}.`,
      });
      continue;
    }

    const hit = await findRoomTypeByRefs(
      tenantId,
      parsed.propertyRef,
      parsed.roomRef,
      batchId,
    );

    if (!hit) {
      results.push({
        fileName: att.fileName,
        url: att.url,
        status: "unmatched",
        propertyRef: parsed.propertyRef,
        roomRef: parsed.roomRef,
        position: parsed.position,
        message: batchId
          ? "No room type with these refs in this import batch."
          : "No room type with these property_ref / room_ref values.",
      });
      continue;
    }

    let bucket = pending.get(hit.id);
    if (!bucket) {
      bucket = { hit, positions: new Map() };
      pending.set(hit.id, bucket);
    }
    bucket.positions.set(parsed.position, att.url);

    results.push({
      fileName: att.fileName,
      url: att.url,
      status: "linked",
      propertyRef: parsed.propertyRef,
      roomRef: parsed.roomRef,
      position: parsed.position,
      roomTypeId: hit.id,
      propertyId: hit.property_id,
    });
  }

  for (const { hit, positions } of pending.values()) {
    const existing = Array.isArray(hit.images) ? hit.images : [];
    const merged = mergeImagesByPosition(existing, positions);

    await query(
      `UPDATE room_types
       SET images = $1::text[], updated_at = now()
       WHERE id = $2 AND tenant_id = $3`,
      [merged, hit.id, tenantId],
    );
  }

  const linked = results.filter((r) => r.status === "linked").length;
  const unmatched = results.length - linked;

  logger.info("room_images_attached", {
    event: "room_images_attached",
    tenantId,
    batchId: batchId ?? null,
    linked,
    unmatched,
    roomTypesUpdated: pending.size,
  });

  return {
    linked,
    unmatched,
    results,
    example: importImageFilenameExample(),
  };
}
