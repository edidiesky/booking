import fs         from "fs";
import path       from "path";
import handlebars from "handlebars";

const compiled = handlebars.compile(
  fs.readFileSync(path.join(__dirname, "../domains/notification/templates/auth.otp.html"), "utf-8")
);

export function authOtpTemplate(p: {
  firstName:   string;
  otp:    string;
}): { subject: string; html: string } {
  return {
    subject: "Welcome to the Booking Platform — OTP Sent",
    html:    compiled({ ...p, year: new Date().getFullYear() }),
  };
}