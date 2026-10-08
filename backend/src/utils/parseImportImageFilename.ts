/**
 * {property_ref}__{room_ref}__{position}.jpg
 * e.g. LKI-001__STD-01__1.jpg
 */

export interface ParsedImportImageName {
  propertyRef: string;
  roomRef: string;
  position: number;
}

const PATTERN =
  /^([A-Za-z0-9][A-Za-z0-9._-]{0,62})__([A-Za-z0-9][A-Za-z0-9._-]{0,62})__([1-9][0-9]{0,2})\.(jpe?g|png|webp|gif)$/i;

export function parseImportImageFilename(
  fileName: string,
): ParsedImportImageName | null {
  const base = fileName.trim().split(/[/\\]/).pop() ?? fileName.trim();
  const m = base.match(PATTERN);
  if (!m) return null;

  return {
    propertyRef: m[1],
    roomRef: m[2],
    position: Number(m[3]),
  };
}

export function importImageFilenameExample(
  propertyRef = "LKI-001",
  roomRef = "STD-01",
  position = 1,
): string {
  return `${propertyRef}__${roomRef}__${position}.jpg`;
}
