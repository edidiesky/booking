import { UserProfileDetail } from "@/components/common/userProfile/types";
import { apiSlice } from "./apiSlice";
import { PROFILE_URL } from "@/constants/api";

interface RawUserProfileDetail {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  user_type: string;
  created_at: string;
  profile: {
    bio: string | null;
    avatar_url: string | null;
    address: Record<string, string>;
    preferences: Record<string, unknown>;
  } | null;
}

function toUserProfileDetail(raw: RawUserProfileDetail): UserProfileDetail {
  return {
    id: raw.id,
    email: raw.email,
    firstName: raw.first_name,
    lastName: raw.last_name,
    phone: raw.phone,
    userType: raw.user_type,
    createdAt: raw.created_at,
    profile: raw.profile
      ? {
          bio: raw.profile.bio,
          avatarUrl: raw.profile.avatar_url,
          address: raw.profile.address,
          preferences: raw.profile.preferences,
        }
      : null,
  };
}

interface DetailResponse {
  success: boolean;
  data: RawUserProfileDetail;
}

export const userProfileApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<UserProfileDetail, string>({
      query: (userId) => ({ url: `${PROFILE_URL}/user/${userId}` }),
      transformResponse: (res: DetailResponse) => toUserProfileDetail(res.data),
      providesTags: (_r, _e, userId) => [{ type: "Profile", id: userId }],
    }),
  }),
});

export const { useGetUserProfileQuery } = userProfileApi;
