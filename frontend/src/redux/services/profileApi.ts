import { apiSlice }    from "./apiSlice";
import { PROFILE_URL } from "@/constants/api";
import type { Profile, UpdateProfilePayload } from "@/types/api";

interface ProfileResponse { success: boolean; data: Profile; }

export const profileApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query<ProfileResponse, void>({
      query: () => ({ url: PROFILE_URL }),
      providesTags: ["Profile"],
    }),

    updateMyProfile: builder.mutation<ProfileResponse, UpdateProfilePayload>({
      query: (body) => ({ url: PROFILE_URL, method: "PATCH", body }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
} = profileApi;