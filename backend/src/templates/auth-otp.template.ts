import fs from "fs";
import path from "path";
import handlebars from "handlebars";

const compiled = handlebars.compile(
  fs.readFileSync(
    path.join(__dirname, "../domains/notification/templates/auth.otp.html"),
    "utf-8",
  ),
);

const PURPOSE_COPY: Record<
  string,
  { subject: string; title: string; body: string }
> = {
  email_verify: {
    subject: "Verify your email",
    title: "Verify your<br />email",
    body: "Use the code below to verify your email address.",
  },
  two_factor_enable: {
    subject: "Confirm two-factor setup",
    title: "Confirm<br />2FA setup",
    body: "Use the code below to continue enabling two-factor authentication.",
  },
  two_factor_disable: {
    subject: "Confirm disable two-factor",
    title: "Confirm<br />disable 2FA",
    body: "Use the code below to confirm turning off two-factor authentication.",
  },
  login: {
    subject: "Your login code",
    title: "Your login<br />code",
    body: "Use the one-time password below to complete your login.",
  },
  default: {
    subject: "Your verification code",
    title: "Your verification<br />code",
    body: "Use the one-time password below to continue.",
  },
};

export function authOtpTemplate(p: {
  firstName: string;
  otp: string;
  purpose?: string;
  expiresMinutes?: number;
  iconUrl?: string;
}): { subject: string; html: string } {
  const copy = PURPOSE_COPY[p.purpose ?? ""] ?? PURPOSE_COPY.default;
  const expiresMinutes = p.expiresMinutes ?? 10;

  return {
    subject: copy.subject,
    html: compiled({
      firstName: p.firstName,
      otp: p.otp,
      titleHtml: copy.title,
      bodyText: copy.body,
      expiresMinutes,
      year: new Date().getFullYear(),
      iconUrl:
        p.iconUrl ??
        process.env.EMAIL_ICON_OTP ??
        process.env.EMAIL_ICON_DEFAULT ??
        "",
    }),
  };
}