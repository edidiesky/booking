
const MARKER = "/image/upload/";

export function cdnImage(url: string | undefined | null, width: number): string {
  if (!url) return "";
  const at = url.indexOf(MARKER);
  if (at === -1 || !url.includes("res.cloudinary.com")) return url;
  const head = url.slice(0, at + MARKER.length);
  const tail = url.slice(at + MARKER.length);
  const first = tail.split("/")[0] ?? "";
  if (/(^|,)(w|c|f|q)_/.test(first)) return url;
  return `${head}f_auto,q_auto,c_fill,w_${width}/${tail}`;
}

export function cdnSrcSet(url: string | undefined | null, widths: number[]): string | undefined {
  if (!url || !url.includes("res.cloudinary.com")) return undefined;
  return widths.map((w) => `${cdnImage(url, w)} ${w}w`).join(", ");
}
