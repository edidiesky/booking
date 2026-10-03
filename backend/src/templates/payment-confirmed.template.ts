import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import { formatEmailDate } from "../utils/formatEmailDate";

const compiled = handlebars.compile(
  fs.readFileSync(
    path.join(__dirname, "../domains/notification/templates/payment.confirmed.html"),
    "utf-8",
  ),
);

export function paymentConfirmedTemplate(data: {
  guestName: string;
  bookingRef: string;   
  propertyName: string;
  roomTypeName: string;
  amountNgn: number;
  gateway: string;
  transactionId: string;
  checkIn?: string;
  checkOut?: string;
  manageUrl: string;
  supportUrl: string;
  receiptUrl?: string;
}): { subject: string; html: string } {
  const amount = Number(data.amountNgn).toLocaleString("en-NG");
  const gatewayLabel =
    data.gateway.charAt(0).toUpperCase() + data.gateway.slice(1).toLowerCase();

  return {
    subject: `Payment received — ₦${amount} · ${data.bookingRef}`,
    html: compiled({
      guestName: data.guestName,
      bookingRef: data.bookingRef,
      propertyName: data.propertyName,
      roomTypeName: data.roomTypeName,
      amountNgn: amount,
      gateway: gatewayLabel,
      transactionId: data.transactionId,
      checkIn: data.checkIn ? formatEmailDate(data.checkIn) : "",
      checkOut: data.checkOut ? formatEmailDate(data.checkOut) : "",
      hasStay: Boolean(data.checkIn && data.checkOut),
      manageUrl: data.manageUrl,
      supportUrl: data.supportUrl,
      receiptUrl: data.receiptUrl ?? "",
      hasReceipt: Boolean(data.receiptUrl),
      year: new Date().getFullYear(),
    }),
  };
}