import { useState } from "react";
import {
  useGetTenantRolesQuery,
  useListRolesQuery,
  useAssignRoleMutation,
  useRevokeRoleMutation,
} from "@/redux/services/roleApi";
import { useCreateInvitationMutation } from "@/redux/services/invitationApi";
import { showToast } from "@/components/common/Toast";
import type { AssignRolePayload } from "@/types/api";

export function useRoles() {
  const [search, setSearch] = useState("");

  const { data: tenantRolesData, isLoading: loadingAssignments } =
    useGetTenantRolesQuery();
  const { data: rolesData, isLoading: loadingRoles } = useListRolesQuery();

  const [assignRole, { isLoading: assigning }] = useAssignRoleMutation();
  const [revokeRole, { isLoading: revoking }] = useRevokeRoleMutation();
  const [createInvitation, { isLoading: inviting }] =
    useCreateInvitationMutation();

  const assignments = tenantRolesData?.data ?? [];
  const roles = rolesData?.data ?? [];

  const filtered = assignments.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = [a.firstName, a.lastName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      a.userId.toLowerCase().includes(q) ||
      a.roleName.toLowerCase().includes(q) ||
      (a.email?.toLowerCase().includes(q) ?? false) ||
      name.includes(q)
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
    } catch {
      /* errorMiddleware */
    }
  };

  const handleInvite = async (payload: { email: string; roleId: string }) => {
    try {
      await createInvitation(payload).unwrap();
      showToast("Invitation has been sent sucessfully. Kindly instruct the user to check his email for the invitation link.", "success");
      return true;
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { message?: string } };
      const message =
        e?.data?.message ??
        (e?.status === 403
          ? "You don't have permission to invite members."
          : "Could not send invitation. Kindly reach out to the platform adminstrators for further guides");
      showToast(message, "error");
      return false;
    }
  };

  return {
    assignments: filtered,
    isLoading: loadingAssignments || loadingRoles,
    roles,
    search,
    setSearch,
    handleAssign,
    assigning,
    handleRevoke,
    revoking,
    handleInvite,
    inviting,
  };
}
