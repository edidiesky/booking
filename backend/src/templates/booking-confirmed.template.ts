import fs          from "fs";
import path        from "path";
import handlebars  from "handlebars";

const compiled = handlebars.compile(
  fs.readFileSync(path.join(__dirname, "../domains/notification/templates/booking.confirmed.html"), "utf-8")
);

export function bookingConfirmedTemplate(p: {
  guestName:      string;
  bookingRef:     string;
  propertyName:   string;
  roomTypeName:   string;
  checkIn:        string;
  checkOut:       string;
  nights:         number;
  totalAmountNgn: number;
  manageUrl:      string;
  supportUrl:     string;
}): { subject: string; html: string } {
  return {
    subject: `Booking Confirmed — ${p.bookingRef}`,
    html:    compiled({ ...p, year: new Date().getFullYear() }),
  };
}