import { AMENITY_OPTIONS } from "@/constants/amenities";

/** Loose input: accepts the list API shape, discovery shapes and favourites. */
export interface ListingSource {
  id: string;
  name: string;
  images?: string[];
  amenities?: string[];
  property_type?: string;
  propertyType?: string;
  address?: { city?: string; state?: string; country?: string; street?: string } | null;
  city?: string;
  fromPrice?: number | null;
  from_price?: number | null;
  roomTypes?: {
    images?: string[];
    amenities?: string[];
    base_price_ngn: number | string;
    bedrooms?: number;
    beds?: number;
    bathrooms?: number;
    maxOccupancy?: number;
  }[];
}

export interface ListingCardModel {
  id: string;
  href: string;
  name: string;
  typeLabel: string | null;
  images: string[];
  location: string;
  price: number | null;
  priceIsFrom: boolean;
  spec: { kind: "bed" | "bath" | "guests"; label: string } | null;
  amenity: { label: string; more: number } | null;
}

const LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  AMENITY_OPTIONS.map((a) => [a.id, a.label]),
);

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function amenityLabel(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return (
    LABEL_BY_ID[key] ??
    LABEL_BY_ID[raw] ??
    raw.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * One deterministic rule set, so every card in a grid reads the same way.
 * Price and spec come from the SAME room type (the cheapest), so a card never
 * pairs the cheapest price with the biggest unit's rooms.
 */
export function toListingCard(p: ListingSource): ListingCardModel {
  const rooms = (p.roomTypes ?? []).map((r) => ({ ...r, price: Number(r.base_price_ngn) }));
  const priced = rooms.filter((r) => Number.isFinite(r.price) && r.price > 0);
  const cheapest = priced.length
    ? priced.reduce((a, b) => (b.price < a.price ? b : a))
    : undefined;

  const explicit = p.fromPrice ?? p.from_price ?? null;
  const price = cheapest?.price ?? (explicit && explicit > 0 ? explicit : null);
  const priceIsFrom = new Set(priced.map((r) => r.price)).size > 1;

  let spec: ListingCardModel["spec"] = null;
  if (cheapest) {
    if (typeof cheapest.bedrooms === "number") {
      spec = {
        kind: "bed",
        label: cheapest.bedrooms === 0 ? "Studio" : plural(cheapest.bedrooms, "bedroom", "bedrooms"),
      };
    } else if (typeof cheapest.beds === "number" && cheapest.beds > 0) {
      spec = { kind: "bed", label: plural(cheapest.beds, "bed", "beds") };
    } else if (typeof cheapest.bathrooms === "number" && cheapest.bathrooms > 0) {
      spec = { kind: "bath", label: plural(cheapest.bathrooms, "bath", "baths") };
    } else if (typeof cheapest.maxOccupancy === "number" && cheapest.maxOccupancy > 0) {
      spec = { kind: "guests", label: `Sleeps ${cheapest.maxOccupancy}` };
    }
  }

  const amenitySet = new Set<string>([
    ...(p.amenities ?? []),
    ...rooms.flatMap((r) => r.amenities ?? []),
  ]);
  const amenities = Array.from(amenitySet).filter(Boolean);
  const amenity = amenities.length
    ? { label: amenityLabel(amenities[0]), more: amenities.length - 1 }
    : null;

  const images = Array.from(
    new Set([...(p.images ?? []), ...rooms.flatMap((r) => r.images ?? [])].filter(Boolean)),
  ).slice(0, 8);

  // City and state only. Never the street: it exposes a host's address.
  const city = p.address?.city ?? p.city ?? "";
  const state = p.address?.state ?? "";
  const location = [city, state && state.toLowerCase() !== city.toLowerCase() ? state : ""]
    .filter(Boolean)
    .join(", ");

  const type = p.property_type ?? p.propertyType ?? "";

  return {
    id: p.id,
    href: `/properties/${p.id}`,
    name: p.name.trim(),
    typeLabel: type ? titleCase(type) : null,
    images,
    location,
    price,
    priceIsFrom,
    spec,
    amenity,
  };
}
