import { getBase64Fonts } from "../utils/fontLoader";

interface BookingReceiptData {
  bookingRef: string;
  propertyName: string;
  roomTypeName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmountNgn: number;
  platformFeeNgn: number;
  transactionId: string;
  gateway: string;
  paidAt: Date;
  verificationUrl: string;
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtNaira(n: number): string {
  return `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function shortRef(ref: string): string {
  return ref.replace("BK-", "").toUpperCase();
}

export function buildBookingReceiptHtml(data: BookingReceiptData): string {
  const fonts = getBase64Fonts();
  const issueDate = fmtDate(new Date());

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Booking Receipt ${escapeHtml(shortRef(data.bookingRef))}</title>
<style>
  @font-face { font-family:'Cabinet'; src:url(data:font/ttf;base64,${fonts.regular}) format('truetype'); font-weight:400; }
  @font-face { font-family:'Cabinet'; src:url(data:font/ttf;base64,${fonts.medium})  format('truetype'); font-weight:500; }
  @font-face { font-family:'Cabinet'; src:url(data:font/ttf;base64,${fonts.bold})    format('truetype'); font-weight:700; }
  * { margin:0; padding:0; box-sizing:border-box; font-family:'Cabinet', sans-serif; }
  body { color:#1a1a1a; font-size:14px; }
  .page { padding:40px; }
  .header-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; }
  .doc-title { font-size:28px; font-weight:700; }
  .meta-row { display:flex; gap:32px; margin-bottom:24px; padding-bottom:24px; border-bottom:1px solid #e5e5e5; }
  .meta-label { display:block; font-size:11px; color:#888; text-transform:uppercase; }
  .meta-value { display:block; font-size:14px; font-weight:500; margin-top:4px; }
  .stay-block { margin-bottom:24px; padding:16px; background:#fafafa; border-radius:8px; }
  .stay-row { display:flex; justify-content:space-between; margin-bottom:8px; }
  .due-row { display:flex; justify-content:space-between; align-items:center; padding:16px 0; border-top:2px solid #1a1a1a; border-bottom:2px solid #1a1a1a; margin:24px 0; }
  .due-amount { font-size:20px; font-weight:700; }
  .verify-link { font-size:12px; color:#1a1a1a; text-decoration:underline; }
  .footer { margin-top:40px; font-size:11px; color:#999; text-align:center; }
</style>
</head>
<body>
  <div class="page">
    <div class="header-row">
      <div class="doc-title">Booking Receipt</div>
    </div>

    <div class="meta-row">
      <div><span class="meta-label">Booking reference</span><span class="meta-value">${escapeHtml(shortRef(data.bookingRef))}</span></div>
      <div><span class="meta-label">Date of issue</span><span class="meta-value">${issueDate}</span></div>
      <div><span class="meta-label">Transaction ID</span><span class="meta-value">${escapeHtml(data.transactionId)}</span></div>
    </div>

    <div class="stay-block">
      <div class="stay-row"><span>Guest</span><strong>${escapeHtml(data.guestName)}</strong></div>
      <div class="stay-row"><span>Property</span><strong>${escapeHtml(data.propertyName)}</strong></div>
      <div class="stay-row"><span>Room type</span><strong>${escapeHtml(data.roomTypeName)}</strong></div>
      <div class="stay-row"><span>Check-in</span><strong>${fmtDate(data.checkIn)}</strong></div>
      <div class="stay-row"><span>Check-out</span><strong>${fmtDate(data.checkOut)}</strong></div>
      <div class="stay-row"><span>Nights</span><strong>${data.nights}</strong></div>
      <div class="stay-row"><span>Payment method</span><strong>${escapeHtml(data.gateway)}</strong></div>
    </div>

    <div class="due-row">
      <span class="due-amount">${fmtNaira(data.totalAmountNgn)} paid on ${fmtDate(data.paidAt)}</span>
      <a class="verify-link" href="${data.verificationUrl}">Verify this booking</a>
    </div>

    <div class="footer">
      This receipt confirms your reservation and payment. Platform fee included: ${fmtNaira(data.platformFeeNgn)}.
    </div>
  </div>
</body>
</html>`;
}
