import { getBase64Fonts } from "../utils/fontLoader";

interface GuestInvoiceData {
  invoiceNumber:  string;
  bookingRef:     string;
  propertyName:   string;
  roomTypeName:   string;
  guestName:      string;
  guestEmail:     string;
  checkIn:        string;
  checkOut:       string;
  nights:         number;
  totalAmountNgn: number;
  platformFeeNgn: number;
  transactionId:  string;
  gateway:        string;
  paidAt:         Date;
}

function escapeHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtNaira(n: number): string {
  return `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
}

const LOGO_SVG = `
<svg width="120" height="24" viewBox="0 0 120 24" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="21" font-family="'Cabinet', sans-serif" font-size="20" font-weight="700" fill="#1a1a1a">StaBooking</text>
</svg>`;

function buildAddressBlock(label: string, lines: string[]): string {
  const rows = lines.filter(Boolean).map((l) => `<div class="addr-line">${escapeHtml(l)}</div>`).join("");
  return `<div class="addr-col"><div class="addr-label">${label}</div>${rows}</div>`;
}

export function buildGuestInvoiceHtml(data: GuestInvoiceData): string {
  const issueDate = fmtDate(new Date());
  const paidDate = fmtDate(data.paidAt);
  const nightlyRate = data.totalAmountNgn / Math.max(data.nights, 1);

  const fromBlock = buildAddressBlock("From", ["StaBooking", "support@stayBooking.io"]);
  const billToBlock = buildAddressBlock("Bill to", [data.guestName, data.guestEmail]);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Invoice ${escapeHtml(data.invoiceNumber)}</title>
<style>${buildStyles()}</style>
</head>
<body>
  <div class="page">
    <div class="header-row">
      <h1 class="doc-title">Invoice</h1>
      <div class="logo">${LOGO_SVG}</div>
    </div>

    <div class="meta-row">
      <div class="meta-item"><span class="meta-label">Invoice number</span><span class="meta-value">${escapeHtml(data.invoiceNumber)}</span></div>
      <div class="meta-item"><span class="meta-label">Date of issue</span><span class="meta-value">${issueDate}</span></div>
      <div class="meta-item"><span class="meta-label">Booking reference</span><span class="meta-value">${escapeHtml(data.bookingRef)}</span></div>
    </div>

    <div class="addr-row">
      ${fromBlock}
      ${billToBlock}
    </div>

    <div class="due-row">
      <div class="due-amount">${fmtNaira(data.totalAmountNgn)} paid on ${paidDate}</div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th class="th-desc">Description</th>
          <th class="th-qty">Nights</th>
          <th class="th-unit">Unit price</th>
          <th class="th-amount">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr class="item-row">
          <td class="item-desc">
            <div class="item-title">${escapeHtml(data.propertyName)}</div>
            <div class="item-sub">${escapeHtml(data.roomTypeName)} &middot; ${fmtDate(data.checkIn)} &ndash; ${fmtDate(data.checkOut)}</div>
          </td>
          <td class="item-qty">${data.nights}</td>
          <td class="item-unit">${fmtNaira(nightlyRate)}</td>
          <td class="item-amount">${fmtNaira(data.totalAmountNgn)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals-block">
      <div class="totals-row"><span class="totals-label">Subtotal</span><span class="totals-value">${fmtNaira(data.totalAmountNgn)}</span></div>
      <div class="totals-row"><span class="totals-label">Platform fee (included)</span><span class="totals-value">${fmtNaira(data.platformFeeNgn)}</span></div>
      <div class="totals-row totals-row--total"><span class="totals-label">Total</span><span class="totals-value">${fmtNaira(data.totalAmountNgn)}</span></div>
      <div class="totals-row totals-row--paid"><span class="totals-label">Amount paid</span><span class="totals-value">${fmtNaira(data.totalAmountNgn)}</span></div>
    </div>

    <div class="tx-block">
      <div class="tx-label">Payment details</div>
      <div class="tx-row"><span class="tx-key">Transaction ID</span><span class="tx-val">${escapeHtml(data.transactionId)}</span></div>
      <div class="tx-row"><span class="tx-key">Payment method</span><span class="tx-val">${escapeHtml(data.gateway)}</span></div>
      <div class="tx-row"><span class="tx-key">Status</span><span class="tx-val">Paid in full</span></div>
    </div>

    <div class="footer">
      This invoice was generated electronically and does not require a signature.<br/>
      StaBooking &middot; support@stayBooking.io
    </div>
  </div>
</body>
</html>`;
}

function buildStyles(): string {
  const fonts = getBase64Fonts();
  return `
@font-face { font-family: 'Cabinet'; font-weight: 400; font-style: normal; src: url('data:font/truetype;base64,${fonts.regular}') format('truetype'); }
@font-face { font-family: 'Cabinet'; font-weight: 500; font-style: normal; src: url('data:font/truetype;base64,${fonts.medium}') format('truetype'); }
@font-face { font-family: 'Cabinet'; font-weight: 700; font-style: normal; src: url('data:font/truetype;base64,${fonts.bold}') format('truetype'); }
* { margin: 0; padding: 0; box-sizing: border-box; }
@page { size: A4; margin: 0; }
html, body { font-family: 'Cabinet', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; color: #1a1a1a; line-height: 1.55; background: #fff; }
.page { width: 210mm; min-height: 297mm; padding: 18mm 18mm 24mm; box-sizing: border-box; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
.doc-title { font-size: 24px; font-weight: 700; color: #1a1a1a; }
.logo { line-height: 0; }
.meta-row { display: flex; gap: 36px; margin-bottom: 28px; }
.meta-item { display: flex; flex-direction: column; gap: 2px; }
.meta-label { font-size: 13px; font-weight: 400; color: #6b6b6b; }
.meta-value { font-size: 14px; font-weight: 500; color: #1a1a1a; }
.addr-row { display: flex; gap: 60px; margin-bottom: 28px; }
.addr-col { flex: 1; }
.addr-label { font-size: 13px; font-weight: 700; color: #6b6b6b; margin-bottom: 6px; }
.addr-line { font-size: 14px; font-weight: 400; color: #1a1a1a; }
.due-row { margin-bottom: 28px; }
.due-amount { font-size: 17px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; }
.items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
.items-table thead tr { border-bottom: 1px solid #1a1a1a; }
.items-table th { font-size: 13px; font-weight: 500; color: #6b6b6b; text-align: left; padding: 0 0 8px; }
.th-qty, .th-unit, .th-amount { text-align: right; }
.item-row td { padding: 10px 0; border-bottom: 1px solid #eaeaea; font-size: 14px; font-weight: 400; vertical-align: top; }
.item-title { font-weight: 500; color: #1a1a1a; }
.item-sub { font-size: 12px; color: #6b6b6b; margin-top: 2px; }
.item-qty, .item-unit, .item-amount { text-align: right; white-space: nowrap; }
.totals-block { width: 260px; margin-left: auto; margin-bottom: 36px; }
.totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; font-weight: 400; color: #444; }
.totals-row--total { border-top: 1px solid #eaeaea; margin-top: 4px; padding-top: 10px; font-weight: 700; color: #1a1a1a; }
.totals-row--paid { font-weight: 700; color: #1a1a1a; }
.tx-block { border-top: 1px solid #eaeaea; padding-top: 16px; margin-bottom: 36px; }
.tx-label { font-size: 13px; font-weight: 700; color: #6b6b6b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
.tx-row { display: flex; font-size: 13px; font-weight: 400; padding: 4px 0; }
.tx-key { width: 150px; color: #6b6b6b; flex-shrink: 0; }
.tx-val { color: #1a1a1a; word-break: break-all; }
.footer { font-size: 13px; font-weight: 400; color: #9a9a9a; text-align: center; margin-top: 24px; }
`;
}