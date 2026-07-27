export interface GeocodeResult {
  latitude:  number;
  longitude: number;
  displayName: string;
}

export async function geocodeAddress(address: {
  street: string; city: string; state: string; country: string;
}): Promise<GeocodeResult | null> {
  const query = [address.street, address.city, address.state, address.country].filter(Boolean).join(", ");
  if (!query.trim()) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: {
      // Nominatim's usage policy requires identifying the calling
      // application, this is that identification.
      "Accept-Language": "en",
    },
  });
  if (!res.ok) return null;

  const results = await res.json() as { lat: string; lon: string; display_name: string }[];
  if (!results.length) return null;

  return {
    latitude:    Number(results[0].lat),
    longitude:   Number(results[0].lon),
    displayName: results[0].display_name,
  };
}