import { apiSlice }    from "./apiSlice";
import { INVOICE_URL } from "@/constants/api";
import type { InvoiceResponse } from "@/types/api";

export const invoiceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGuestInvoice: builder.query<InvoiceResponse, string>({
      query: (bookingId) => ({ url: `${INVOICE_URL}/guest/${bookingId}` }),
      providesTags: (_r, _e, bookingId) => [{ type: "Invoice", id: bookingId }],
    }),
    getHostStatement: builder.query<InvoiceResponse, string>({
      query: (bookingId) => ({ url: `${INVOICE_URL}/host/${bookingId}` }),
      providesTags: (_r, _e, bookingId) => [{ type: "Invoice", id: `host-${bookingId}` }],
    }),
  }),
});

export const {
  useGetGuestInvoiceQuery,
  useLazyGetGuestInvoiceQuery,
  useGetHostStatementQuery,
} = invoiceApi;