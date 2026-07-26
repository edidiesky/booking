import { generatePdfFromHtml }     from "../config/puppeteer.singleton";
import { buildGuestInvoiceHtml }   from "../templates/guest.invoice.template";
import logger                      from "./logger";

interface GuestInvoiceInput {
  invoiceNumber:  string;
  bookingId:      string;
  bookingRef:     string;
  propertyName:   string;
  roomTypeName:   string;
  guestName:      string;
  guestEmail:     string;
  checkIn:        string;
  checkOut:       string;
  nights:         number;
  totalAmountNgn: number;
  platformFeeNgn: number;
  transactionId:  string;
  gateway:        string;
  paidAt:         Date;
}

export async function generateGuestInvoiceBuffer(data: GuestInvoiceInput): Promise<Buffer> {
  const html = buildGuestInvoiceHtml(data);
  try {
    const buffer = await generatePdfFromHtml(html);
    logger.info("guest_invoice_pdf_generated", {
      event: "guest_invoice_pdf_generated", bookingId: data.bookingId, invoiceNumber: data.invoiceNumber, bytes: buffer.length,
    });
    return buffer;
  } catch (err) {
    logger.error("guest_invoice_pdf_generation_failed", {
      event: "guest_invoice_pdf_generation_failed", bookingId: data.bookingId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}