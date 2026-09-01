import { apiSlice } from "./apiSlice";
import { INVITATION_URL } from "@/constants/api";
import type {
  AcceptInvitationPayload,
  ApiSuccessResponse,
  CreateInvitationPayload,
  Invitation,
} from "@/types/api";

interface RawInvitation {
  id: string;
  tenant_id: string;
  role_id: string;
  role_name?: string;
  email: string;
  status: Invitation["status"];
  invited_by: string;
  expires_at: string;
  created_at: string;
}

function toInvitation(raw: RawInvitation): Invitation {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    roleId: raw.role_id,
    roleName: raw.role_name,
    email: raw.email,
    status: raw.status,
    invitedBy: raw.invited_by,
    expiresAt: raw.expires_at,
    createdAt: raw.created_at,
  };
}

export const invitationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    acceptInvitation: builder.mutation<
      {
        success: boolean;
        data: {
          accessToken: string;
          refreshToken: string;
          user: {
            id: string;
            firstName?: string;
            lastName?: string;
            userType: string;
            tenantId?: string;
            email?: string;
          };
        };
      },
      AcceptInvitationPayload
    >({
      query: (body) => ({
        url: `${INVITATION_URL}/accept`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invitation", "Role"],
    }),
    listInvitations: builder.query<
      { success: boolean; data: Invitation[] },
      void
    >({
      query: () => ({ url: INVITATION_URL }),
      transformResponse: (r: { success: boolean; data: RawInvitation[] }) => ({
        success: r.success,
        data: (r.data ?? []).map(toInvitation),
      }),
      providesTags: ["Invitation"],
    }),

    createInvitation: builder.mutation<
      { success: boolean; data: { message: string; expiresInSeconds: number } },
      CreateInvitationPayload
    >({
      query: (body) => ({
        url: INVITATION_URL,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invitation", "Role"],
    }),

    revokeInvitation: builder.mutation<ApiSuccessResponse, string>({
      query: (email) => ({
        url: `${INVITATION_URL}/${encodeURIComponent(email)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Invitation"],
    }),
  }),
});

export const {
  useListInvitationsQuery,
  useCreateInvitationMutation,
  useRevokeInvitationMutation,
  useAcceptInvitationMutation,
} = invitationApi;
