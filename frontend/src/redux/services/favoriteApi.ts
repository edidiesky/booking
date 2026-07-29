import { apiSlice } from "./apiSlice";
import { FAVORITE_URL } from "@/constants/api";
import type { FavoriteProperty } from "@/types/api";

export const favoriteApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listFavorites: builder.query<{ success: boolean; data: FavoriteProperty[] }, { page?: number } | void>({
      query: (params) => ({ url: `${FAVORITE_URL}?page=${params?.page ?? 1}` }),
      providesTags: ["Favorite"],
    }),

    // Cheap way to annotate a whole listing page: one call with every
    // visible property id, not one call per card.
    listFavoritedIds: builder.query<{ success: boolean; data: string[] }, string[]>({
      query: (propertyIds) => ({ url: `${FAVORITE_URL}/ids?propertyIds=${propertyIds.join(",")}` }),
      providesTags: ["Favorite"],
    }),

    addFavorite: builder.mutation<{ success: boolean }, string>({
      query: (propertyId) => ({ url: `${FAVORITE_URL}/${propertyId}`, method: "PUT" }),
      invalidatesTags: ["Favorite"],
    }),

    removeFavorite: builder.mutation<{ success: boolean }, string>({
      query: (propertyId) => ({ url: `${FAVORITE_URL}/${propertyId}`, method: "DELETE" }),
      invalidatesTags: ["Favorite"],
    }),
  }),
});

export const {
  useListFavoritesQuery,
  useListFavoritedIdsQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = favoriteApi;