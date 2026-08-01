import { apiSlice } from "./apiSlice";
import { PROPERTY_URL } from "@/constants/api";

const DISCOVERY_URL = PROPERTY_URL.replace(/\/properties$/, "/properties-discovery");

export interface PopularProperty {
  id:            string;
  name:          string;
  images:        string[];
  property_type: string;
  address:       { street: string; city: string; state: string; country: string; zipCode?: string };
  latitude:      number | null;
  longitude:     number | null;
  booking_count: number;
  favorite_count: number;
  avg_rating:    number;
  review_count:  number;
}

export interface NewProperty {
  id:            string;
  name:          string;
  images:        string[];
  property_type: string;
  address:       { street: string; city: string; state: string; country: string; zipCode?: string };
  latitude:      number | null;
  longitude:     number | null;
  created_at:    string;
}

export const discoveryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPopularProperties: builder.query<{ success: boolean; data: PopularProperty[] }, { limit?: number } | void>({
      query: (params) => ({ url: `${DISCOVERY_URL}/popular?limit=${params?.limit ?? 12}` }),
    }),
    getNewProperties: builder.query<{ success: boolean; data: NewProperty[] }, { limit?: number } | void>({
      query: (params) => ({ url: `${DISCOVERY_URL}/new?limit=${params?.limit ?? 12}` }),
    }),
  }),
});

export const { useGetPopularPropertiesQuery, useGetNewPropertiesQuery } = discoveryApi;