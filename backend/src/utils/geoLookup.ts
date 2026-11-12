export interface GeoLookupResult {
  city: string | null;
  country: string | null;
}

export interface GeoLookupProvider {
  lookup(ipAddress: string): Promise<GeoLookupResult>;
}

export const noOpGeoLookup: GeoLookupProvider = {
  async lookup(): Promise<GeoLookupResult> {
    return { city: null, country: null };
  },
};