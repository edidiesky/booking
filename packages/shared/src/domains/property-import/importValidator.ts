import { PROPERTY_IMPORT_COLUMNS, PROPERTY_IMPORT_LIMITS } from "./importSpec";
import type { ImportProperty, ImportRoom, ImportRowError } from "./importTypes";

type Row = Record<string, string>;

const REF_RE = /^[A-Za-z0-9-]{1,64}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const PROPERTY_TYPES = ["shortlet", "hotel", "guesthouse"] as const;

const PROPERTY_COLUMNS = [
  "property_name",
  "property_type",
  "property_description",
  "street",
  "city",
  "state",
  "country",
  "latitude",
  "longitude",
  "check_in_time",
  "check_out_time",
  "property_amenities",
] as const;

export function validateHeaders(headers: string[]): string | null {
  const actual = headers.map((h) => h.trim());
  const missing = PROPERTY_IMPORT_COLUMNS.filter((c) => !actual.includes(c));
  const unknown = actual.filter(
    (h) =>
      h !== "" && !(PROPERTY_IMPORT_COLUMNS as readonly string[]).includes(h),
  );
  if (missing.length === 0 && unknown.length === 0) return null;
  const parts: string[] = [];
  if (missing.length) parts.push(`missing columns: ${missing.join(", ")}`);
  if (unknown.length) parts.push(`unknown columns: ${unknown.join(", ")}`);
  return `This file does not match the current template (${parts.join("; ")}). Download the latest template and copy your data into it.`;
}

function splitList(raw: string): string[] {
  const items = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(items)];
}

class RowCollector {
  readonly errors: ImportRowError[] = [];
  constructor(
    private readonly row: number,
    private readonly propertyRef?: string,
  ) {}
  add(column: string, message: string): void {
    this.errors.push({
      row: this.row,
      column,
      propertyRef: this.propertyRef,
      message,
    });
  }
  text(
    r: Row,
    column: string,
    opts: { required: boolean; min?: number; max: number },
  ): string | null {
    const v = (r[column] ?? "").trim();
    if (!v) {
      if (opts.required) this.add(column, "Required.");
      return null;
    }
    if (opts.min !== undefined && v.length < opts.min) {
      this.add(column, `Must be at least ${opts.min} characters.`);
      return null;
    }
    if (v.length > opts.max) {
      this.add(column, `Must be at most ${opts.max} characters.`);
      return null;
    }
    return v;
  }
  int(r: Row, column: string, min: number, max: number): number | null {
    const v = (r[column] ?? "").trim();
    if (!/^\d+$/.test(v)) {
      this.add(column, "Must be a whole number.");
      return null;
    }
    const n = Number(v);
    if (n < min || n > max) {
      this.add(column, `Must be between ${min} and ${max}.`);
      return null;
    }
    return n;
  }
  money(r: Row, column: string, max: number): number | null {
    // Sellers often type thousands separators: "45,000" or "45 000".
    const v = (r[column] ?? "").trim().replace(/[,\s]/g, "");
    if (!/^\d+(\.\d{1,2})?$/.test(v)) {
      this.add(
        column,
        "Must be a number with at most 2 decimal places, for example 45000 or 45000.50.",
      );
      return null;
    }
    const n = Number(v);
    if (n <= 0 || n > max) {
      this.add(column, `Must be greater than 0 and at most ${max}.`);
      return null;
    }
    return n;
  }
  coord(r: Row, column: string, limit: number): number | null | undefined {
    const v = (r[column] ?? "").trim();
    if (!v) return null;
    const n = Number(v);
    if (!Number.isFinite(n) || Math.abs(n) > limit) {
      this.add(column, `Must be a number between -${limit} and ${limit}.`);
      return undefined;
    }
    return n;
  }
  time(r: Row, column: string, fallback: string): string | null {
    const v = (r[column] ?? "").trim();
    if (!v) return fallback;
    if (!TIME_RE.test(v)) {
      this.add(column, "Must be a 24-hour time like 14:00.");
      return null;
    }
    return v;
  }
  amenities(r: Row, column: string): string[] {
    const list = splitList(r[column] ?? "");
    if (list.length > 50) this.add(column, "At most 50 amenities.");
    if (list.some((a) => a.length > 60))
      this.add(column, "Each amenity must be at most 60 characters.");
    return list.slice(0, 50);
  }
}

function fingerprint(r: Row): string {
  return PROPERTY_COLUMNS.map((c) => (r[c] ?? "").trim()).join("\u0000");
}

export function groupAndValidate(records: Row[]): {
  properties: ImportProperty[];
  errors: ImportRowError[];
} {
  const errors: ImportRowError[] = [];

  if (records.length === 0) {
    return {
      properties: [],
      errors: [{ row: 2, message: "The file has no data rows." }],
    };
  }
  if (records.length > PROPERTY_IMPORT_LIMITS.maxRows) {
    return {
      properties: [],
      errors: [
        {
          row: PROPERTY_IMPORT_LIMITS.maxRows + 2,
          message: `At most ${PROPERTY_IMPORT_LIMITS.maxRows} rows per file. Split the file and send each part.`,
        },
      ],
    };
  }

  const groups = new Map<string, { rows: number[]; records: Row[] }>();
  records.forEach((r, i) => {
    const line = i + 2;
    const ref = (r["property_ref"] ?? "").trim();
    if (!REF_RE.test(ref)) {
      errors.push({
        row: line,
        column: "property_ref",
        message: ref
          ? "Use only letters, numbers and hyphens, at most 64 characters."
          : "Required.",
      });
      return;
    }
    const g = groups.get(ref) ?? { rows: [], records: [] };
    g.rows.push(line);
    g.records.push(r);
    groups.set(ref, g);
  });

  if (groups.size > PROPERTY_IMPORT_LIMITS.maxProperties) {
    errors.push({
      row: 2,
      message: `At most ${PROPERTY_IMPORT_LIMITS.maxProperties} properties per file (found ${groups.size}).`,
    });
    return { properties: [], errors };
  }

  const properties: ImportProperty[] = [];

  for (const [ref, group] of groups) {
    const propertyErrors: ImportRowError[] = [];

    // Property columns must agree across all rows of this property.
    const first = group.records[0];
    const firstPrint = fingerprint(first);
    group.records.forEach((r, i) => {
      if (i > 0 && fingerprint(r) !== firstPrint) {
        propertyErrors.push({
          row: group.rows[i],
          propertyRef: ref,
          message: `Property details differ from row ${group.rows[0]} for the same property_ref. Every room row of a property must repeat identical property details.`,
        });
      }
    });

    if (group.records.length > PROPERTY_IMPORT_LIMITS.maxRoomsPerProperty) {
      propertyErrors.push({
        row: group.rows[0],
        propertyRef: ref,
        message: `At most ${PROPERTY_IMPORT_LIMITS.maxRoomsPerProperty} room types per property.`,
      });
    }

    const pc = new RowCollector(group.rows[0], ref);
    const name = pc.text(first, "property_name", {
      required: true,
      min: 3,
      max: 200,
    });
    const rawType = (first["property_type"] ?? "").trim().toLowerCase();
    if (!(PROPERTY_TYPES as readonly string[]).includes(rawType)) {
      pc.add("property_type", `Must be one of: ${PROPERTY_TYPES.join(", ")}.`);
    }
    const description = pc.text(first, "property_description", {
      required: false,
      max: 5000,
    });
    const street = pc.text(first, "street", { required: true, max: 200 });
    const city = pc.text(first, "city", { required: true, max: 100 });
    const state = pc.text(first, "state", { required: true, max: 100 });
    const country = pc.text(first, "country", { required: true, max: 100 });
    const latitude = pc.coord(first, "latitude", 90);
    const longitude = pc.coord(first, "longitude", 180);
    if (
      (latitude === null) !== (longitude === null) &&
      latitude !== undefined &&
      longitude !== undefined
    ) {
      pc.add(
        "latitude",
        "Provide both latitude and longitude, or leave both empty.",
      );
    }
    const checkInTime = pc.time(first, "check_in_time", "14:00");
    const checkOutTime = pc.time(first, "check_out_time", "11:00");
    const amenities = pc.amenities(first, "property_amenities");
    propertyErrors.push(...pc.errors);

    const rooms: ImportRoom[] = [];
    const seenRoomRefs = new Map<string, number>();
    group.records.forEach((r, i) => {
      const line = group.rows[i];
      const rc = new RowCollector(line, ref);
      const roomRef = (r["room_ref"] ?? "").trim();
      if (!REF_RE.test(roomRef)) {
        rc.add(
          "room_ref",
          roomRef
            ? "Use only letters, numbers and hyphens, at most 64 characters."
            : "Required.",
        );
      } else if (seenRoomRefs.has(roomRef)) {
        rc.add(
          "room_ref",
          `Duplicate room_ref within this property (also on row ${seenRoomRefs.get(roomRef)}).`,
        );
      } else {
        seenRoomRefs.set(roomRef, line);
      }
      const roomName = rc.text(r, "room_name", {
        required: true,
        min: 2,
        max: 100,
      });
      const roomDescription = rc.text(r, "room_description", {
        required: false,
        max: 2000,
      });
      const maxOccupancy = rc.int(r, "max_occupancy", 1, 50);
      const basePriceNgn = rc.money(r, "base_price_ngn", 100_000_000);
      const quantity = rc.int(r, "quantity", 1, 500);
      const roomAmenities = rc.amenities(r, "room_amenities");
      propertyErrors.push(...rc.errors);
      if (
        rc.errors.length === 0 &&
        roomName !== null &&
        maxOccupancy !== null &&
        basePriceNgn !== null &&
        quantity !== null
      ) {
        rooms.push({
          ref: roomRef,
          name: roomName,
          description: roomDescription,
          maxOccupancy,
          basePriceNgn,
          quantity,
          amenities: roomAmenities,
          row: line,
        });
      }
    });

    if (propertyErrors.length > 0) {
      errors.push(...propertyErrors);
      continue;
    }

    properties.push({
      ref,
      name: name!,
      propertyType: rawType as ImportProperty["propertyType"],
      description,
      address: {
        street: street!,
        city: city!,
        state: state!,
        country: country!,
      },
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      checkInTime: checkInTime!,
      checkOutTime: checkOutTime!,
      amenities,
      rooms,
      rows: group.rows,
    });
  }

  return { properties, errors };
}
