export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
  });
}