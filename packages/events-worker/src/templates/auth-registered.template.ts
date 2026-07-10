import fs         from "fs";
import path       from "path";
import handlebars from "handlebars";

const compiled = handlebars.compile(
  fs.readFileSync(path.join(__dirname, "../domains/notification/templates/auth.registered.html"), "utf-8")
);

export function authRegisteredTemplate(p: {
  firstName:   string;
  lastName:    string;
  userType:    string;
  tenantName?: string;
  loginUrl:    string;
  supportUrl:  string;
}): { subject: string; html: string } {
  return {
    subject: "Welcome to the Booking Platform — Account Created",
    html:    compiled({ ...p, year: new Date().getFullYear() }),
  };
}