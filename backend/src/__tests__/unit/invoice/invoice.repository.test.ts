import { describe, it, expect, jest, beforeEach } from "@jest/globals";

jest.mock("@booking/shared", () => ({ queryOne: jest.fn() }));
jest.mock("../../utils/metrics", () => ({ trackError: jest.fn() }));
jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn() },
}));

import { queryOne } from "@booking/shared";
import { trackError } from "../../../utils/metrics";
import { invoiceRepository } from "../../../domains/invoice/invoice.repository";

const mockQueryOne   = queryOne   as jest.MockedFunction<typeof queryOne>;
const mockTrackError = trackError as jest.MockedFunction<typeof trackError>;

describe("invoiceRepository", () => {
  beforeEach(() => {jest.clearAllMocks()});

  describe("reserveInvoiceNumber", () => {
    it("formats a guest_invoice number as INV-<year>-<6-digit-padded-seq>", async () => {
      mockQueryOne.mockResolvedValue({ nextval: "42" } as never);

      const result = await invoiceRepository.reserveInvoiceNumber("guest_invoice");

      expect(result).toBe(`INV-${new Date().getFullYear()}-000042`);
    });

    it("formats a host_statement number with the PAY prefix, different sequence", async () => {
      mockQueryOne.mockResolvedValue({ nextval: "7" } as never);

      const result = await invoiceRepository.reserveInvoiceNumber("host_statement");

      expect(result).toBe(`PAY-${new Date().getFullYear()}-000007`);
      expect(mockQueryOne).toHaveBeenCalledWith(expect.stringContaining("host_statement_seq"));
    });

    it("falls back to 0 when nextval returns nothing, doesn't throw", async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await invoiceRepository.reserveInvoiceNumber("guest_invoice");

      expect(result).toBe(`INV-${new Date().getFullYear()}-000000`);
    });
  });

  describe("insert", () => {
    it("relies on ON CONFLICT (booking_id, type) to make re-generation idempotent", async () => {
      mockQueryOne.mockResolvedValue({ id: "inv-1", pdf_url: "https://x/new.pdf" } as never);

      await invoiceRepository.insert({
        invoiceNumber: "INV-2026-000001", type: "guest_invoice", bookingId: "b-1",
        tenantId: "t-1", amountNgn: 50000, pdfUrl: "https://x/new.pdf",
      });

      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining("ON CONFLICT (booking_id, type) DO UPDATE SET pdf_url"),
        expect.any(Array),
      );
    });

    it("tracks the failure and rethrows on insert error", async () => {
      mockQueryOne.mockRejectedValue(new Error("unique violation"));

      await expect(
        invoiceRepository.insert({ invoiceNumber: "X", type: "guest_invoice", bookingId: "b-1", tenantId: "t-1", amountNgn: 50000, pdfUrl: "x" }),
      ).rejects.toThrow("unique violation");

      expect(mockTrackError).toHaveBeenCalledWith("invoice_create_failed", "invoice_repository", "high");
    });
  });
});