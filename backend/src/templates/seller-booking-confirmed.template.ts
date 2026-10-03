import fs from "fs";
import path from "path";
import handlebars from "handlebars";

const compiled = handlebars.compile(
  fs.readFileSync(
    path.join(
      __dirname,
      "../domains/notification/templates/seller.booking-confirmed.html",
    ),
    "utf-8",
  ),
);

function formatNgn(amount: number): string {
  return Number(amount).toLocaleString("en-NG");
}

function nightsLabel(nights: number): string {
  return `${nights} night${nights !== 1 ? "s" : ""}`;
}

export function sellerBookingConfirmedTemplate(p: {
  ownerFirstName: string;
  guestName: string;
  bookingRef: string;
  propertyName: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmountNgn: number;
  hostPayoutNgn?: number;
  dashboardUrl: string;
  supportUrl: string;
  iconUrl?: string;
  eventDate?: string;
}): { subject: string; html: string } {
  return {
    subject: `New booking — ${p.propertyName} (${p.bookingRef})`,
    html: compiled({
      ...p,
      totalAmountNgn: formatNgn(p.totalAmountNgn),
      hostPayoutNgn:
        p.hostPayoutNgn != null ? formatNgn(p.hostPayoutNgn) : undefined,
      nightsLabel: nightsLabel(p.nights),
      eventDate:
        p.eventDate ??
        new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      iconUrl: p.iconUrl ?? "",
      year: new Date().getFullYear(),
    }),
  };
}