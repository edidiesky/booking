import { PROPERTY_IMPORT_LIMITS, isImportFileForTenant } from "@booking/shared";
import { ImportFailure } from "./importFailure";

const DOWNLOAD_TIMEOUT_MS = 30_000;

/**
 * Downloads an import file by Cloudinary public_id, never by a URL from the
 * client. The URL is built here from our own cloud name, redirects are
 * refused, and the body is streamed with a byte cap so an oversized file is
 * rejected without being buffered in full.
 */
export async function downloadImportFile(
  publicId: string,
  tenantId: string,
): Promise<Buffer> {
  if (!isImportFileForTenant(publicId, tenantId)) {
    throw new ImportFailure(
      "The uploaded file is not in this account's import folder.",
    );
  }
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloud) throw new Error("CLOUDINARY_CLOUD_NAME is not set");

  const url = `https://res.cloudinary.com/${encodeURIComponent(cloud)}/raw/upload/${publicId}`;
  const res = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });
  if (!res.ok || !res.body) {
    throw new ImportFailure(
      `Could not download the uploaded file (HTTP ${res.status}). Upload it again.`,
    );
  }

  const max = PROPERTY_IMPORT_LIMITS.maxFileBytes;
  const tooLarge = () =>
    new ImportFailure(
      `The file is larger than ${Math.round(max / 1024 / 1024)}MB. Split it into smaller files.`,
    );

  const declared = Number(res.headers.get("content-length") ?? "0");
  if (declared > max) throw tooLarge();

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      throw tooLarge();
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
