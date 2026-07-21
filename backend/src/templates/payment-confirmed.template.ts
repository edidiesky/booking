import fs         from "fs";
import path       from "path";
import handlebars from "handlebars";

const compiled = handlebars.compile(
  fs.readFileSync(path.join(__dirname, "../domains/notification/templates/payment.confirmed.html"), "utf-8")
);

export function paymentConfirmedTemplate(data: {
  guestName:      string;
  bookingRef:     string;
  amountNgn:      number;
  gateway:        string;
  transactionId:  string;
  manageUrl:      string;
  supportUrl:     string;
  roomTypeName: string;
  receiptUrl?: string;
}): { subject: string; html: string } {
  return {
    subject: `Payment Received — ₦${data.amountNgn.toLocaleString("en-NG")} for ${data.roomTypeName}`,
    html: compiled({ ...data, year: new Date().getFullYear() }),
  };
}