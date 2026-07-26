import { generatePdfFromHtml }     from "../config/puppeteer.singleton";
import { buildHostStatementHtml }  from "../templates/host.statement.template";
import logger                      from "./logger";

interface HostStatementInput {
  statementNumber: string;
  bookingId:       string;
  bookingRef:      string;
  propertyName:    string;
  roomTypeName:    string;
  hostName:        string;
  guestName:       string;
  checkIn:         string;
  checkOut:        string;
  nights:          number;
  totalAmountNgn:  number;
  platformFeeNgn:  number;
  hostPayoutNgn:   number;
  releasedAt:      Date;
}

export async function generateHostStatementBuffer(data: HostStatementInput): Promise<Buffer> {
  const html = buildHostStatementHtml(data);
  try {
    const buffer = await generatePdfFromHtml(html);
    logger.info("host_statement_pdf_generated", {
      event: "host_statement_pdf_generated", bookingId: data.bookingId, statementNumber: data.statementNumber, bytes: buffer.length,
    });
    return buffer;
  } catch (err) {
    logger.error("host_statement_pdf_generation_failed", {
      event: "host_statement_pdf_generation_failed", bookingId: data.bookingId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}