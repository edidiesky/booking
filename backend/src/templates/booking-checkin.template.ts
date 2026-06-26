import fs         from "fs";
import path       from "path";
import handlebars from "handlebars";

const compiled = handlebars.compile(
  fs.readFileSync(path.join(__dirname, "../domains/notification/templates/booking.checkin.html"), "utf-8")
);

export function bookingCheckinTemplate(p: {
  guestName:    string;
  bookingRef:   string;
  propertyName: string;
  checkIn:      string;
  checkOut:     string;
  supportUrl:   string;
}): { subject: string; html: string } {
  return {
    subject: `Welcome! You Have Checked In — ${p.bookingRef}`,
    html:    compiled({ ...p, year: new Date().getFullYear() }),
  };
}