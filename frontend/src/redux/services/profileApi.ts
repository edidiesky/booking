import { apiSlice } from "./apiSlice";
import { PROFILE_URL } from "@/constants/api";
import type { Profile, UpdateProfilePayload } from "@/types/api";

interface RawProfile {
  user_id?: string;
  userId?: string;
  display_name?: string | null;
  displayName?: string;
  bio?: string | null;
  avatar_url?: string | null;
  avatarUrl?: string;
  job_title?: string | null;
  jobTitle?: string;
  phone?: string | null;
  tax_id?: string | null;
  taxId?: string;
  tax_id_verified_at?: string | null;
  taxIdVerifiedAt?: string | null;
  identity_verified_at?: string | null;
  identityVerifiedAt?: string | null;
  address?: Profile["address"];
  updated_at?: string;
  updatedAt?: string;
}

function toProfile(raw: RawProfile): Profile {
  return {
    userId: raw.userId ?? raw.user_id ?? "",
    displayName: raw.displayName ?? raw.display_name ?? "",
    bio: raw.bio ?? undefined,
    avatarUrl: raw.avatarUrl ?? raw.avatar_url ?? undefined,
    jobTitle: raw.jobTitle ?? raw.job_title ?? undefined,
    phone: raw.phone ?? undefined,
    taxId: raw.taxId ?? raw.tax_id ?? undefined,
    taxIdVerifiedAt: raw.taxIdVerifiedAt ?? raw.tax_id_verified_at ?? null,
    identityVerifiedAt:
      raw.identityVerifiedAt ?? raw.identity_verified_at ?? null,
    address: raw.address ?? {},
    updatedAt: raw.updatedAt ?? raw.updated_at ?? "",
  };
}

export const profileApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query<{ success: boolean; data: Profile }, void>({
      query: () => ({ url: PROFILE_URL }),
      transformResponse: (r: { success: boolean; data: RawProfile }) => ({
        success: r.success,
        data: toProfile(r.data),
      }),
      providesTags: ["Profile"],
    }),

    updateMyProfile: builder.mutation<
      { success: boolean; data: Profile },
      UpdateProfilePayload
    >({
      query: (body) => ({ url: PROFILE_URL, method: "PATCH", body }),
      transformResponse: (r: { success: boolean; data: RawProfile }) => ({
        success: r.success,
        data: toProfile(r.data),
      }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
} = profileApi;