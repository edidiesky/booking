import { queryOne } from "@booking/shared";
import { trackError } from "../../utils/metrics";
import logger from "../../utils/logger";

export type InvoiceType = "guest_invoice" | "host_statement";

export interface Invoice {
  id:             string;
  invoice_number: string;
  type:           InvoiceType;
  booking_id:     string;
  tenant_id:      string;
  guest_user_id?: string;
  amount_ngn:     number;
  pdf_url:        string | null;
  created_at:     Date;
}

const SEQUENCE_BY_TYPE: Record<InvoiceType, string> = {
  guest_invoice:  "guest_invoice_seq",
  host_statement: "host_statement_seq",
};

const PREFIX_BY_TYPE: Record<InvoiceType, string> = {
  guest_invoice:  "INV",
  host_statement: "PAY",
};

export const invoiceRepository = {
  async findByBookingAndType(bookingId: string, type: InvoiceType): Promise<Invoice | null> {
    return queryOne<Invoice>(
      `SELECT * FROM invoices WHERE booking_id = $1 AND type = $2`,
      [bookingId, type],
    );
  },
  
  async reserveInvoiceNumber(type: InvoiceType): Promise<string> {
    const row = await queryOne<{ nextval: string }>(`SELECT nextval('${SEQUENCE_BY_TYPE[type]}')`);
    const seq = row?.nextval ?? "0";
    return `${PREFIX_BY_TYPE[type]}-${new Date().getFullYear()}-${seq.padStart(6, "0")}`;
  },

  async insert(data: {
    invoiceNumber: string;
    type:          InvoiceType;
    bookingId:     string;
    tenantId:      string;
    guestUserId?:  string;
    amountNgn:     number;
    pdfUrl:        string;
  }): Promise<Invoice> {
    try {
      const row = await queryOne<Invoice>(
        `INSERT INTO invoices (invoice_number, type, booking_id, tenant_id, guest_user_id, amount_ngn, pdf_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (booking_id, type) DO UPDATE SET pdf_url = EXCLUDED.pdf_url
         RETURNING *`,
        [data.invoiceNumber, data.type, data.bookingId, data.tenantId, data.guestUserId ?? null, data.amountNgn, data.pdfUrl],
      );
      logger.info("invoice_created", { event: "invoice_created", type: data.type, invoiceNumber: data.invoiceNumber, bookingId: data.bookingId });
      return row!;
    } catch (err) {
      trackError("invoice_create_failed", "invoice_repository", "high");
      throw err;
    }
  },
};