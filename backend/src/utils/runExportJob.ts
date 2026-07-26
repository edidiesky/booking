import { jobRepository } from "@booking/shared";
import type { JobState } from "@booking/shared";
import { generateTabularReportBuffer } from "./generateTabularReportBuffer";
import { uploadToCloudinary } from "./cloudinary";
import type { TabularReportData } from "../templates/tabular-report.template";
import logger from "./logger";

const JOB_TYPE = "pdf_export";

interface ExportResult {
  pdfUrl: string;
}

async function setState(
  jobId: string,
  patch: { state: JobState; progress: number; error?: string; result?: ExportResult },
): Promise<void> {
  await jobRepository.setState<ExportResult>(JOB_TYPE, jobId, {
    jobId, jobType: JOB_TYPE, updatedAt: new Date().toISOString(), ...patch,
  });
}

export async function runExportJob(
  jobId:       string,
  buildReport: () => Promise<TabularReportData>,
  cloudinaryPublicIdPrefix: string,
): Promise<void> {
  try {
    await setState(jobId, { state: "processing", progress: 20 });
    const reportData = await buildReport();
    await setState(jobId, { state: "processing", progress: 60 });
    const buffer = await generateTabularReportBuffer(reportData);
    const url = await uploadToCloudinary(buffer, `${cloudinaryPublicIdPrefix}_${jobId}`);
    await setState(jobId, { state: "done", progress: 100, result: { pdfUrl: url } });
  } catch (err) {
    logger.error("export_job_failed", { event: "export_job_failed", jobId, error: (err as Error).message });
    await setState(jobId, { state: "error", progress: 0, error: (err as Error).message });
  }
}

export async function enqueueExportJob(jobId: string): Promise<void> {
  await setState(jobId, { state: "queued", progress: 0 });
}