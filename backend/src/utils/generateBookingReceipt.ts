import { generatePdfFromHtml }        from "../config/puppeteer.singleton";
import { buildBookingReceiptHtml }    from "../templates/booking-receipt.template";
import logger                         from "./logger";

interface ReceiptInput {
  bookingId:       string;
  bookingRef:      string;
  propertyName:    string;
  roomTypeName:    string;
  guestName:       string;
  checkIn:         string;
  checkOut:        string;
  nights:          number;
  totalAmountNgn:  number;
  platformFeeNgn:  number;
  transactionId:   string;
  gateway:         string;
  paidAt:          Date;
}

export async function generateBookingReceiptBuffer(data: ReceiptInput): Promise<Buffer> {
  const verificationUrl = `${process.env.WEB_ORIGIN}/trips/${data.bookingId}/verify`;
  const html = buildBookingReceiptHtml({ ...data, verificationUrl });

  try {
    const buffer = await generatePdfFromHtml(html);
    logger.info("booking_receipt_pdf_generated", {
      event: "booking_receipt_pdf_generated", bookingId: data.bookingId, bytes: buffer.length,
    });
    return buffer;
  } catch (err) {
    logger.error("booking_receipt_pdf_generation_failed", {
      event: "booking_receipt_pdf_generation_failed", bookingId: data.bookingId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}