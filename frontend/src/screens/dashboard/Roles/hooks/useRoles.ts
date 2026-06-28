import { useState }                from "react";
import {
  useGetTenantRolesQuery,
  useListRolesQuery,
  useAssignRoleMutation,
  useRevokeRoleMutation,
} from "@/redux/services/roleApi";
import { showToast }              from "@/components/common/Toast";
import type { AssignRolePayload } from "@/types/api";

export function useRoles() {
  const [search, setSearch] = useState("");

  const { data: tenantRolesData, isLoading: loadingAssignments } = useGetTenantRolesQuery();
  const { data: rolesData,       isLoading: loadingRoles        } = useListRolesQuery();

  const [assignRole,  { isLoading: assigning }] = useAssignRoleMutation();
  const [revokeRole,  { isLoading: revoking  }] = useRevokeRoleMutation();

  const assignments = tenantRolesData?.data ?? [];
  const roles       = rolesData?.data       ?? [];

  const filtered = assignments.filter((a) => {
    if (!search) return true;
    return (
      a.userId.toLowerCase().includes(search.toLowerCase()) ||
      a.roleName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleAssign = async (payload: AssignRolePayload) => {
    try {
      await assignRole(payload).unwrap();
      showToast("Role assigned.", "success");
      return true;
    } catch {
      return false;
    }
  };

  const handleRevoke = async (userId: string) => {
    try {
      await revokeRole(userId).unwrap();
      showToast("Role revoked.", "success");
    } catch { /* errorMiddleware */ }
  };

  return {
    assignments: filtered, isLoading: loadingAssignments || loadingRoles,
    roles,
    search, setSearch,
    handleAssign, assigning,
    handleRevoke, revoking,
  };
}