export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

/**
 * Resolve a street address to coordinates via OpenStreetMap Nominatim.
 * Returns null when nothing matches or the network fails.
 */
export async function geocodeAddress(address: {
  street: string;
  city: string;
  state: string;
  country: string;
}): Promise<GeocodeResult | null> {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.country,
  ].filter((p) => p?.trim());
  if (parts.length < 2) return null;

  const query = parts.join(", ");
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?format=json&limit=1&addressdetails=0` +
    `&q=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "BukkingsPropertyGeocoder/1.0 (contact@bukkings.space)",
      },
    });
    if (!res.ok) return null;

    const results = (await res.json()) as {
      lat: string;
      lon: string;
      display_name: string;
    }[];
    if (!results.length) return null;

    const latitude = Number(results[0].lat);
    const longitude = Number(results[0].lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return {
      latitude,
      longitude,
      displayName: results[0].display_name,
    };
  } catch {
    return null;
  }
}