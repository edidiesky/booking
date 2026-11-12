import { apiSlice } from "./apiSlice";
import { SESSION_URL } from "@/constants/api";
export interface UserSession {
  id: string;
  deviceLabel: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  os: string | null;
  browser: string | null;
  ipAddress: string;
  city: string | null;
  country: string | null;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

interface RawUserSession {
  id: string;
  device_label: string;
  device_type: UserSession["deviceType"];
  os: string | null;
  browser: string | null;
  ip_address: string;
  city: string | null;
  country: string | null;
  created_at: string;
  last_active_at: string;
  isCurrent: boolean;
}

function toSession(raw: RawUserSession): UserSession {
  return {
    id: raw.id,
    deviceLabel: raw.device_label,
    deviceType: raw.device_type,
    os: raw.os,
    browser: raw.browser,
    ipAddress: raw.ip_address,
    city: raw.city,
    country: raw.country,
    createdAt: raw.created_at,
    lastActiveAt: raw.last_active_at,
    isCurrent: raw.isCurrent,
  };
}

export const sessionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMySessions: builder.query<UserSession[], void>({
      query: () => ({ url: `${SESSION_URL}/me/sessions` }),
      transformResponse: (res: { success: boolean; data: RawUserSession[] }) =>
        res.data.map(toSession),
      providesTags: ["Session"],
    }),

    revokeSession: builder.mutation<void, string>({
      query: (sessionId) => ({
        url: `${SESSION_URL}/me/sessions/${sessionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Session"],
    }),

    logoutOtherSessions: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: `${SESSION_URL}/me/sessions/logout-others`,
        method: "POST",
      }),
      invalidatesTags: ["Session"],
    }),

    logoutAllSessions: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: `${SESSION_URL}/me/sessions/logout-all`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetMySessionsQuery,
  useRevokeSessionMutation,
  useLogoutOtherSessionsMutation,
  useLogoutAllSessionsMutation,
} = sessionApi;
