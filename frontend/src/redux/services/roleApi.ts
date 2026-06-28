import { apiSlice }  from "./apiSlice";
import { ROLE_URL }  from "@/constants/api";
import type {
  RoleListResponse, UserRoleAssignment,
  AssignRolePayload, GrantPermissionPayload,
  UserPermissionOverride, ResolvedPermissions,
  ApiSuccessResponse,
} from "@/types/api";

interface UserRoleResponse       { success: boolean; data: UserRoleAssignment;       }
interface UserRoleListResponse   { success: boolean; data: UserRoleAssignment[];     }
interface PermOverrideResponse   { success: boolean; data: UserPermissionOverride;   }
interface PermOverrideListResp   { success: boolean; data: UserPermissionOverride[]; }
interface ResolvedPermsResponse  { success: boolean; data: ResolvedPermissions;      }

export const roleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listRoles: builder.query<RoleListResponse, void>({
      query: () => ({ url: ROLE_URL }),
      providesTags: ["Role"],
    }),

    getTenantRoles: builder.query<UserRoleListResponse, void>({
      query: () => ({ url: `${ROLE_URL}/tenant` }),
      providesTags: ["Role"],
    }),

    getUserRole: builder.query<UserRoleResponse, string>({
      query: (userId) => ({ url: `${ROLE_URL}/tenant/users/${userId}` }),
      providesTags: (_r, _e, userId) => [{ type: "Role", id: userId }],
    }),

    assignRole: builder.mutation<ApiSuccessResponse, AssignRolePayload>({
      query: (body) => ({ url: `${ROLE_URL}/tenant/assign`, method: "POST", body }),
      invalidatesTags: ["Role"],
    }),

    revokeRole: builder.mutation<ApiSuccessResponse, string>({
      query: (userId) => ({ url: `${ROLE_URL}/tenant/users/${userId}/revoke`, method: "DELETE" }),
      invalidatesTags: ["Role"],
    }),

    grantUserPermission: builder.mutation<PermOverrideResponse, GrantPermissionPayload>({
      query: (body) => ({ url: `${ROLE_URL}/tenant/users/permissions`, method: "POST", body }),
      invalidatesTags: ["Permission"],
    }),

    getUserPermissions: builder.query<PermOverrideListResp, string>({
      query: (userId) => ({ url: `${ROLE_URL}/tenant/users/${userId}/permissions` }),
      providesTags: (_r, _e, userId) => [{ type: "Permission", id: userId }],
    }),

    revokeUserPermission: builder.mutation<ApiSuccessResponse, { userId: string; permissionId: string }>({
      query: ({ userId, permissionId }) => ({
        url: `${ROLE_URL}/tenant/users/${userId}/permissions/${permissionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Permission"],
    }),

    getResolvedPermissions: builder.query<ResolvedPermsResponse, string>({
      query: (userId) => ({ url: `${ROLE_URL}/tenant/users/${userId}/permissions/resolved` }),
      providesTags: (_r, _e, userId) => [{ type: "Permission", id: `resolved-${userId}` }],
    }),
  }),
});

export const {
  useListRolesQuery,
  useGetTenantRolesQuery,
  useGetUserRoleQuery,
  useAssignRoleMutation,
  useRevokeRoleMutation,
  useGrantUserPermissionMutation,
  useGetUserPermissionsQuery,
  useRevokeUserPermissionMutation,
  useGetResolvedPermissionsQuery,
} = roleApi;