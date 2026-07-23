import { apiSlice }  from "./apiSlice";
import { ROLE_URL }  from "@/constants/api";
import type {
  RoleListResponse, UserRoleAssignment, Role, RoleDetail, RoleDetailResponse,
  AssignRolePayload, GrantPermissionPayload, CreateCustomRolePayload,
  UpdateRolePermissionsPayload,
  UserPermissionOverride, ResolvedPermissions,
  ApiSuccessResponse,
} from "@/types/api";

interface UserRoleResponse       { success: boolean; data: UserRoleAssignment;       }
interface UserRoleListResponse   { success: boolean; data: UserRoleAssignment[];     }
interface PermOverrideResponse   { success: boolean; data: UserPermissionOverride;   }
interface PermOverrideListResp   { success: boolean; data: UserPermissionOverride[]; }
interface ResolvedPermsResponse  { success: boolean; data: ResolvedPermissions;      }

interface RawRole {
  id: string; name: string; slug: string; description: string;
  is_system: boolean; tenant_id: string | null;
  created_at: string; updated_at: string;
}
interface RawPermission {
  id: string; resource: string; action: string; description?: string; category: string;
}
interface RawRoleMember {
  user_id: string; first_name?: string; last_name?: string; email?: string; assigned_at: string;
}
interface RawRoleDetail {
  role: RawRole;
  includedPermissions: RawPermission[];
  availablePermissions: RawPermission[];
  members: RawRoleMember[];
}

function toRole(raw: RawRole): Role {
  return {
    id: raw.id, name: raw.name, slug: raw.slug, description: raw.description,
    isSystem: raw.is_system, tenantId: raw.tenant_id,
    createdAt: raw.created_at, updatedAt: raw.updated_at,
  };
}

function toRoleDetail(raw: RawRoleDetail): RoleDetail {
  return {
    role: toRole(raw.role),
    includedPermissions: raw.includedPermissions,
    availablePermissions: raw.availablePermissions,
    members: raw.members.map((m) => ({
      userId: m.user_id, firstName: m.first_name, lastName: m.last_name,
      email: m.email, assignedAt: m.assigned_at,
    })),
  };
}

export const roleApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listRoles: builder.query<RoleListResponse, void>({
      query: () => ({ url: ROLE_URL }),
      transformResponse: (r: { success: boolean; data: RawRole[] }) => ({
        success: r.success, data: r.data.map(toRole),
      }),
      providesTags: ["Role"],
    }),

    listTenantRoles: builder.query<RoleListResponse, void>({
      query: () => ({ url: `${ROLE_URL}/tenant/list` }),
      transformResponse: (r: { success: boolean; data: RawRole[] }) => ({
        success: r.success, data: r.data.map(toRole),
      }),
      providesTags: ["Role"],
    }),

    getRoleDetail: builder.query<RoleDetailResponse, string>({
      query: (roleId) => ({ url: `${ROLE_URL}/tenant/roles/${roleId}` }),
      transformResponse: (r: { success: boolean; data: RawRoleDetail }) => ({
        success: r.success, data: toRoleDetail(r.data),
      }),
      providesTags: (_r, _e, roleId) => [{ type: "Role", id: roleId }],
    }),

    createCustomRole: builder.mutation<RoleDetailResponse, CreateCustomRolePayload>({
      query: (body) => ({ url: `${ROLE_URL}/tenant/roles`, method: "POST", body }),
      transformResponse: (r: { success: boolean; data: RawRoleDetail }) => ({
        success: r.success, data: toRoleDetail(r.data),
      }),
      invalidatesTags: ["Role"],
    }),

    updateRolePermissions: builder.mutation<RoleDetailResponse, UpdateRolePermissionsPayload>({
      query: ({ roleId, permissionIds }) => ({
        url: `${ROLE_URL}/tenant/roles/${roleId}/permissions`,
        method: "PATCH",
        body: { permissionIds },
      }),
      transformResponse: (r: { success: boolean; data: RawRoleDetail }) => ({
        success: r.success, data: toRoleDetail(r.data),
      }),
      invalidatesTags: (_r, _e, { roleId }) => [{ type: "Role", id: roleId }, "Role"],
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
  useListTenantRolesQuery,
  useGetRoleDetailQuery,
  useCreateCustomRoleMutation,
  useUpdateRolePermissionsMutation,
  useGetTenantRolesQuery,
  useGetUserRoleQuery,
  useAssignRoleMutation,
  useRevokeRoleMutation,
  useGrantUserPermissionMutation,
  useGetUserPermissionsQuery,
  useRevokeUserPermissionMutation,
  useGetResolvedPermissionsQuery,
} = roleApi;