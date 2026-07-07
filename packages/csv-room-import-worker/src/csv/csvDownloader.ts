import fetch from "node-fetch";
import { logger } from "@booking/shared";

export async function downloadCsv(fileUrl: string, jobId: string): Promise<string> {
  try {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`Download failed with status ${res.status}`);
    const text = await res.text();
    logger.info("csv_downloaded", { event: "csv_downloaded", jobId, fileUrl });
    return text;
  } catch (err) {
    logger.error("csv_download_failed", { event: "csv_download_failed", jobId, fileUrl, error: (err as Error).message });
    throw new Error(`Failed to download CSV: ${(err as Error).message}`);
  }
}