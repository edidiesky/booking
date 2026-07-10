import { apiSlice }   from "./apiSlice";
import { RENTER_URL } from "@/constants/api";
import type { Renter } from "@/types/api";

interface ListResponse {
  success: boolean;
  data: { renters: Renter[]; stats: { total: number; withPhone: number; withEmergency: number } };
}

interface DetailResponse {
  success: boolean;
  data: {
    renter: Renter;
    occupancy: { property_name: string; room_type_name: string; check_out: string; status: string } | null;
  };
}

export const renterApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRenters: builder.query<ListResponse, void>({
      query: () => ({ url: RENTER_URL }),
      providesTags: ["Renter"],
    }),

    getRenterDetail: builder.query<DetailResponse, string>({
      query: (id) => ({ url: `${RENTER_URL}/${id}` }),
      providesTags: (_r, _e, id) => [{ type: "Renter", id }],
    }),

    createRenter: builder.mutation<{ success: boolean; data: Renter }, Partial<Renter>>({
      query: (body) => ({ url: RENTER_URL, method: "POST", body }),
      invalidatesTags: ["Renter"],
    }),
  }),
});

export const {
  useGetRentersQuery,
  useGetRenterDetailQuery,
  useCreateRenterMutation,
} = renterApi;