import fs         from "fs";
import path       from "path";
import handlebars from "handlebars";

const compiled = handlebars.compile(
  fs.readFileSync(path.join(__dirname, "../domains/notification/templates/auth.password.reset.html"), "utf-8")
);

export function authPasswordRequestResetTemplate(p: {
  notificationId: string;
  email: string;
  firstName?: string;
  resetUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Bukking Platform — Password Reset Request",
    html:    compiled({ ...p, year: new Date().getFullYear() }),
  };
}