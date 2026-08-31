import fs from "fs";
import path from "path";
import handlebars from "handlebars";

const compiled = handlebars.compile(
  fs.readFileSync(
    path.join(__dirname, "../domains/notification/templates/auth.invitation.html"),
    "utf-8",
  ),
);

export type InvitationTemplateInput = {
  tenantName: string;
  roleName: string;
  code: string;
  iconUrl?: string;
  signupUrl?: string;
};

export function invitationTemplate(
  p: InvitationTemplateInput,
): { subject: string; html: string } {
  return {
    subject: `You've been invited to join ${p.tenantName}`,
    html: compiled({
      ...p,
      year: new Date().getFullYear(),
      iconUrl:
        p.iconUrl ??
        process.env.EMAIL_ICON_INVITATION ??
        process.env.EMAIL_ICON_DEFAULT ??
        "",
    }),
  };
}
