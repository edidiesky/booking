export const EMAIL_TOKENS = {
  fontStack: `'Newsreader', Georgia, 'Times New Roman', serif`,
  canvas: "#ffffff",
  ink: "#17191c",
  fog: "#f7f7f8",
  mutedStone: "#4c4c4c",
  lightSteel: "#777b86",
  hintOfGrey: "#a3a6af",
  border: "#f0f0f0",
  accent: "#5d2a1a",
} as const;

const GOOGLE_FONTS_LINK =
  `<link rel="preconnect" href="https://fonts.googleapis.com">` +
  `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` +
  `<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet">`;

export interface EmailInfoRow {
  label: string;
  value: string;
}
export interface EmailCta {
  label: string;
  url: string;
}

export interface EmailLayoutOptions {
  heading: string;
  intro: string;
  secondaryText?: string;
  infoRows?: EmailInfoRow[];
  cta?: EmailCta;
  secondaryLink?: { label: string; url: string };
  closingNote?: string;
}

function renderInfoTable(rows: EmailInfoRow[]): string {
  if (rows.length === 0) return "";
  const cells = rows
    .map(
      (r) => `
    <tr>
      <td style="font-size:15px;color:${EMAIL_TOKENS.lightSteel};padding:12px 16px;border-bottom:1px solid ${EMAIL_TOKENS.border}">${r.label}</td>
      <td style="font-size:15px;color:${EMAIL_TOKENS.ink};padding:12px 16px;border-bottom:1px solid ${EMAIL_TOKENS.border};text-align:right">${r.value}</td>
    </tr>`,
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_TOKENS.fog};border-radius:8px;margin:0 0 32px;text-align:left;overflow:hidden">${cells}</table>`;
}

function renderCta(cta?: EmailCta): string {
  if (!cta) return "";
  return `<a href="${cta.url}" style="background:${EMAIL_TOKENS.accent};color:#ffffff;padding:16px 40px;border-radius:999px;font-weight:600;font-size:15px;text-decoration:none;display:inline-block;margin:8px 0 0">${cta.label}</a>`;
}

export function renderEmailLayout(opts: EmailLayoutOptions): string {
  const {
    heading,
    intro,
    secondaryText,
    infoRows = [],
    cta,
    secondaryLink,
    closingNote,
  } = opts;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${GOOGLE_FONTS_LINK}</head>
<body style="margin:0;padding:0;background:${EMAIL_TOKENS.fog};font-family:${EMAIL_TOKENS.fontStack};color:${EMAIL_TOKENS.mutedStone}">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td height="48"></td></tr>
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:${EMAIL_TOKENS.canvas};border:2px solid ${EMAIL_TOKENS.border};border-radius:20px">
        <tr><td style="padding:40px 48px 8px"><span style="font-size:18px;font-weight:700;color:${EMAIL_TOKENS.ink}">Booking</span></td></tr>
        <tr><td style="padding:24px 48px 48px">
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.3;color:${EMAIL_TOKENS.ink};font-weight:600;font-family:${EMAIL_TOKENS.fontStack}">${heading}</h1>
          <p style="font-size:15px;line-height:26px;color:${EMAIL_TOKENS.mutedStone};margin:0 0 ${secondaryText ? "16px" : "28px"}">${intro}</p>
          ${secondaryText ? `<p style="font-size:15px;line-height:22px;color:${EMAIL_TOKENS.lightSteel};margin:0 0 28px">${secondaryText}</p>` : ""}
          ${renderInfoTable(infoRows)}
          ${renderCta(cta)}
          ${secondaryLink ? `<div style="margin-top:20px"><a href="${secondaryLink.url}" style="color:${EMAIL_TOKENS.accent};font-size:15px;text-decoration:underline">${secondaryLink.label}</a></div>` : ""}
          ${closingNote ? `<p style="font-size:13px;color:${EMAIL_TOKENS.hintOfGrey};margin:32px 0 0;line-height:20px">${closingNote}</p>` : ""}
        </td></tr>
      </table>
      <table width="560" cellpadding="0" cellspacing="0">
        <tr><td height="28"></td></tr>
        <tr><td align="center">
          <p style="margin:0;font-size:12px;letter-spacing:1.5px;color:${EMAIL_TOKENS.hintOfGrey};font-weight:600">BOOKING</p>
          <p style="margin:6px 0 0;font-size:12px;color:${EMAIL_TOKENS.hintOfGrey}">Stays &middot; Support &middot; Help Center</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td height="48"></td></tr>
  </table>
</body>
</html>`;
}
