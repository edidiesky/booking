import { getBase64Fonts } from "../utils/fontLoader";

export interface ReportColumn {
  key:   string;
  label: string;
  align?: "left" | "right";
  width?: string; // e.g. "18%", explicit widths + table-layout:fixed guarantee true column alignment across all rows, not just approximate auto-sizing
}

export interface TabularReportData {
  title:      string;
  subtitle?:  string;
  generatedAt: Date;
  columns:    ReportColumn[];
  rows:       Record<string, string>[];
  totalsRow?: Record<string, string>; // optional summary row, e.g. totals for a payments export
}

// One generic report template, not five near-identical ones, every
// export (bookings/payments/rooms/tenants/escrow) is the same shape:
// a title, a generated-at date, a column header row, data rows, an
// optional totals row. Same CSS/layout family as
// booking-receipt/guest-invoice/host-statement templates, so every PDF
// this app produces looks like it comes from the same company.
function escapeHtml(v: string): string {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const LOGO_SVG = `
<svg width="120" height="24" viewBox="0 0 120 24" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="21" font-family="'Cabinet', sans-serif" font-size="20" font-weight="700" fill="#1a1a1a">StaBooking</text>
</svg>`;

export function buildTabularReportHtml(data: TabularReportData): string {
  const generatedAt = data.generatedAt.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

  const colgroup = data.columns.some((c) => c.width)
    ? `<colgroup>${data.columns.map((c) => `<col style="width:${c.width ?? "auto"}"/>`).join("")}</colgroup>`
    : "";

  const headerRow = data.columns
    .map((c) => `<th class="${c.align === "right" ? "th-right" : ""}">${escapeHtml(c.label)}</th>`)
    .join("");

  const bodyRows = data.rows
    .map((row) => {
      const cells = data.columns
        .map((c) => `<td class="${c.align === "right" ? "td-right" : ""}">${escapeHtml(row[c.key] ?? "")}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const totalsHtml = data.totalsRow
    ? `<tr class="totals-row">${data.columns
        .map((c) => `<td class="${c.align === "right" ? "td-right" : ""}">${escapeHtml(data.totalsRow?.[c.key] ?? "")}</td>`)
        .join("")}</tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${escapeHtml(data.title)}</title>
<style>${buildStyles()}</style>
</head>
<body>
  <div class="page">
    <div class="header-row">
      <div>
        <h1 class="doc-title">${escapeHtml(data.title)}</h1>
        ${data.subtitle ? `<p class="doc-subtitle">${escapeHtml(data.subtitle)}</p>` : ""}
      </div>
      <div class="logo">${LOGO_SVG}</div>
    </div>

    <p class="generated-at">Generated ${generatedAt} &middot; ${data.rows.length} record${data.rows.length === 1 ? "" : "s"}</p>

    <table class="report-table${colgroup ? " fixed-layout" : ""}">
      ${colgroup}
      <thead><tr>${headerRow}</tr></thead>
      <tbody>${bodyRows}${totalsHtml}</tbody>
    </table>

    <div class="footer">StaBooking &middot; support@stayBooking.io</div>
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
@page { size: A4 landscape; margin: 0; }
html, body { font-family: 'Cabinet', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 400; color: #1a1a1a; line-height: 1.5; background: #fff; }
.page { width: 297mm; min-height: 210mm; padding: 14mm 14mm 18mm; box-sizing: border-box; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
.doc-title { font-size: 20px; font-weight: 700; color: #1a1a1a; }
.doc-subtitle { font-size: 12px; font-weight: 400; color: #6b6b6b; margin-top: 2px; }
.logo { line-height: 0; }
.generated-at { font-size: 11px; font-weight: 400; color: #9a9a9a; margin-bottom: 16px; }
.report-table { width: 100%; border-collapse: collapse; }
.report-table.fixed-layout { table-layout: fixed; }
.report-table thead tr { border-bottom: 1.5px solid #1a1a1a; }
.report-table th { font-size: 11px; font-weight: 700; color: #444; text-align: left; padding: 0 16px 8px 0; text-transform: uppercase; letter-spacing: 0.3px; }
.th-right, .td-right { text-align: right; }
.report-table td { padding: 7px 16px 7px 0; border-bottom: 1px solid #eaeaea; font-size: 11px; font-weight: 400; vertical-align: top; }
.totals-row td { border-top: 1.5px solid #1a1a1a; border-bottom: none; font-weight: 700; padding-top: 10px; }
.footer { font-size: 10px; font-weight: 400; color: #9a9a9a; text-align: center; margin-top: 20px; }
`;
}