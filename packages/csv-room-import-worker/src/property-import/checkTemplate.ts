import { PROPERTY_IMPORT_COLUMNS } from "@booking/shared";

export function compareTemplateHeader(firstLine: string): string | null {
  const actual = firstLine
    .replace(/^\uFEFF/, "")
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));
  const expected = [...PROPERTY_IMPORT_COLUMNS];
  if (actual.join(",") === expected.join(",")) return null;
  const missing = expected.filter((c) => !actual.includes(c));
  const extra = actual.filter((c) => !(expected as string[]).includes(c));
  return (
    `Template header mismatch. missing: [${missing.join(", ")}] extra: [${extra.join(", ")}] ` +
    `expected order: ${expected.join(",")}`
  );
}

async function main(): Promise<void> {
  const url = process.env.PROPERTY_IMPORT_TEMPLATE_URL;
  if (!url) throw new Error("PROPERTY_IMPORT_TEMPLATE_URL is not set");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch template: HTTP ${res.status}`);
  const text = await res.text();
  if (!text.startsWith("\uFEFF")) {
    console.warn(
      "Warning: template has no UTF-8 BOM; Excel may re-save it as Windows-1252.",
    );
  }
  const problem = compareTemplateHeader(text.split(/\r?\n/)[0] ?? "");
  if (problem) {
    console.error(problem);
    process.exit(1);
  }
  console.log("Template header matches PROPERTY_IMPORT_COLUMNS.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error((err as Error).message);
    process.exit(1);
  });
}
