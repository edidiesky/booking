
export function formatEmailDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);

  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: process.env.EMAIL_TZ ?? "Africa/Lagos",
  });
  // e.g. "Fri, 3 Oct 2026, 01:00"
}

export function formatEmailDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);

  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: process.env.EMAIL_TZ ?? "Africa/Lagos",
  });
  // e.g. "Fri, 3 Oct 2026"
}