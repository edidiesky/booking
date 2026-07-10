import fs         from "fs";
import path       from "path";
import handlebars from "handlebars";

const compiled = handlebars.compile(
  fs.readFileSync(path.join(__dirname, "../domains/notification/templates/payment.confirmed.html"), "utf-8")
);

export function paymentConfirmedTemplate(p: {
  guestName:      string;
  bookingRef:     string;
  amountNgn:      number;
  gateway:        string;
  transactionId:  string;
  manageUrl:      string;
  supportUrl:     string;
}): { subject: string; html: string } {
  return {
    subject: `Payment Received — ₦${p.amountNgn.toLocaleString()} for ${p.bookingRef}`,
    html:    compiled({ ...p, year: new Date().getFullYear() }),
  };
}