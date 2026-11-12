import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import { formatEmailDate } from "../utils/formatEmailDate";
const compiled = handlebars.compile(
  fs.readFileSync(
    path.join(__dirname, "../domains/notification/templates/booking.confirmed.html"),
    "utf-8",
  ),
);

export function bookingConfirmedTemplate(p: {
  guestName: string;
  bookingRef: string;
  propertyName: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmountNgn: number;
  manageUrl: string;
  supportUrl: string;
  receiptUrl?: string;
}): { subject: string; html: string } {
  const nightsLabel = `${p.nights} night${p.nights !== 1 ? "s" : ""}`;

  return {
    subject: `Booking Confirmed — ${p.bookingRef}`,
    html: compiled({
      guestName: p.guestName,
      bookingRef: p.bookingRef,
      propertyName: p.propertyName,
      roomTypeName: p.roomTypeName,
      checkIn: formatEmailDate(p.checkIn),
      checkOut: formatEmailDate(p.checkOut),
      nightsLabel,
      totalAmountNgn: Number(p.totalAmountNgn).toLocaleString("en-NG"),
      manageUrl: p.manageUrl,
      supportUrl: p.supportUrl,
      receiptUrl: p.receiptUrl ?? "",
      hasReceipt: Boolean(p.receiptUrl),
      year: new Date().getFullYear(),
    }),
  };
}