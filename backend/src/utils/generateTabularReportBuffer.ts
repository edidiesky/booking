import { generatePdfFromHtml } from "../config/puppeteer.singleton";
import { buildTabularReportHtml, type TabularReportData } from "../templates/tabular-report.template";
import logger from "./logger";

export async function generateTabularReportBuffer(data: TabularReportData): Promise<Buffer> {
  const html = buildTabularReportHtml(data);
  try {
    const buffer = await generatePdfFromHtml(html);
    logger.info("tabular_report_pdf_generated", { event: "tabular_report_pdf_generated", title: data.title, rows: data.rows.length, bytes: buffer.length });
    return buffer;
  } catch (err) {
    logger.error("tabular_report_pdf_generation_failed", { event: "tabular_report_pdf_generation_failed", title: data.title, error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}