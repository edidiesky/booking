import fs from "fs";
import path        from "path";
import handlebars  from "handlebars";

const compiled = handlebars.compile(
  fs.readFileSync(path.join(__dirname, "../domains/notification/templates/booking.cancelled.html"), "utf-8")
);

export function bookingCancelledTemplate(p: {
  guestName:   string;
  bookingRef:  string;
  propertyName: string;
  checkIn:     string;
  checkOut:    string;
  reason?:     string;
  supportUrl:  string;
}): { subject: string; html: string } {
  return {
    subject: `Your Booking ${p.bookingRef} Has Been Cancelled`,
    html:    compiled({ ...p, year: new Date().getFullYear() }),
  };
}