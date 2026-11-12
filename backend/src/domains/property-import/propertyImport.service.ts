import { v2 as cloudinary } from "cloudinary";
import { nanoid } from "nanoid";
import {
  PROPERTY_IMPORT_QUEUE,
  importBatchRepository,
  importFolderForTenant,
  isImportFileForTenant,
  logger,
  type ImportBatchRow,
} from "@booking/shared";
import { AppError } from "../../utils/AppError";

import { getRabbitMQChannel } from "../../messaging/connection";

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  uploadUrl: string;
}

export interface ImportSnapshot {
  batchId: string;
  status: ImportBatchRow["status"];
  progress: number;
  fileName: string | null;
  totals: ImportBatchRow["totals"];
  errors: ImportBatchRow["errors"];
  createdProperties: ImportBatchRow["created_properties"];
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function toSnapshot(b: ImportBatchRow): ImportSnapshot {
  return {
    batchId: b.id,
    status: b.status,
    progress: b.progress,
    fileName: b.file_name,
    totals: b.totals,
    errors: b.errors,
    createdProperties: b.created_properties,
    failureReason: b.failure_reason,
    createdAt: b.created_at,
    completedAt: b.completed_at,
  };
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw AppError.serviceUnavailable("File uploads are not configured.");
  return v;
}

export const propertyImportService = {
  /**
   * Signs a Cloudinary upload for one exact public_id inside this tenant's
   * import folder. The browser cannot choose where the file lands, so the
   * worker can trust that any public_id with this prefix belongs to the tenant.
   * Cloudinary rejects a signed request older than one hour.
   */
  createUploadSignature(tenantId: string): UploadSignature {
    const cloudName = requireEnv("CLOUDINARY_CLOUD_NAME");
    const apiKey = requireEnv("CLOUDINARY_API_KEY");
    const apiSecret = requireEnv("CLOUDINARY_API_SECRET");
    const timestamp = Math.floor(Date.now() / 1000);
    // Raw files keep the extension as part of the public_id.
    const publicId = `${importFolderForTenant(tenantId)}${nanoid(16)}.csv`;
    const signature = cloudinary.utils.api_sign_request(
      { public_id: publicId, timestamp },
      apiSecret,
    );
    return {
      cloudName,
      apiKey,
      timestamp,
      signature,
      publicId,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
    };
  },

  async startImport(input: {
    tenantId: string;
    userId: string;
    filePublicId: string;
    fileName?: string;
  }): Promise<ImportSnapshot> {
    if (!isImportFileForTenant(input.filePublicId, input.tenantId)) {
      throw AppError.badRequest("Upload the file again before sending it.");
    }

    let batch: ImportBatchRow;
    try {
      // Committed on its own connection before publishing (see repository).
      batch = await importBatchRepository.create({
        tenantId: input.tenantId,
        createdBy: input.userId,
        filePublicId: input.filePublicId,
        fileName: input.fileName || null,
      });
    } catch (err) {
      if ((err as { code?: string }).code === "23505") {
        throw AppError.conflict("This file is already being imported.");
      }
      throw err;
    }

    const { exchange, routingKey } = PROPERTY_IMPORT_QUEUE;
    try {
      const channel = getRabbitMQChannel();
      // Idempotent. Publishing to an exchange that does not exist yet closes
      // the channel, which happens if the API boots before the worker.
      await channel.assertExchange(exchange, "topic", { durable: true });
      channel.publish(
        exchange,
        routingKey,
        Buffer.from(
          JSON.stringify({
            batchId: batch.id,
            tenantId: input.tenantId,
            userId: input.userId,
            filePublicId: input.filePublicId,
          }),
        ),
        {
          persistent: true,
          contentType: "application/json",
          messageId: batch.id,
        },
      );
    } catch (err) {
      logger.error("property_import_publish_failed", {
        event: "property_import_publish_failed",
        batchId: batch.id,
        error: (err as Error).message,
      });
      // Do not leave a batch stuck in "queued" forever.
      await importBatchRepository.fail(
        batch.id,
        "The import could not be started. Send the file again.",
      );
      throw AppError.serviceUnavailable(
        "The import could not be started. Please try again.",
      );
    }

    return toSnapshot(batch);
  },

  async getImport(tenantId: string, batchId: string): Promise<ImportSnapshot> {
    const batch = await importBatchRepository.findForTenant(batchId, tenantId);
    if (!batch) throw AppError.notFound("Import not found.");
    return toSnapshot(batch);
  },

  async listImports(tenantId: string): Promise<ImportSnapshot[]> {
    return (await importBatchRepository.listForTenant(tenantId)).map(
      toSnapshot,
    );
  },
};
