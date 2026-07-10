import fs         from "fs";
import path       from "path";
import handlebars from "handlebars";

const compiled = handlebars.compile(
  fs.readFileSync(path.join(__dirname, "../domains/notification/templates/payment.failed.html"), "utf-8")
);

export function paymentFailedTemplate(p: {
  guestName:     string;
  bookingRef:    string;
  amountNgn:     number;
  failureReason?: string;
  retryUrl:      string;
  supportUrl:    string;
}): { subject: string; html: string } {
  return {
    subject: `Payment Failed for Booking ${p.bookingRef} — Action Required`,
    html:    compiled({ ...p, year: new Date().getFullYear() }),
  };
}