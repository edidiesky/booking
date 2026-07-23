import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Trash2, Plus, Shield } from "lucide-react";
import Title               from "@/components/dashboard/common/Title";
import SettingsLayout      from "@/components/dashboard/common/SettingsLayout";
import { formatDate }      from "@/utils/formatDate";
import AssignRoleModal     from "./AssignRoleModal";
import CreateRoleModal     from "./CreateRoleModal";
import RoleDetailPanel     from "./RoleDetailPanel";
import { useRoles }        from "./hooks/useRoles";
import { useListTenantRolesQuery } from "@/redux/services/roleApi";

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  "host:admin":     { bg: "#dbeafe", color: "#1d4ed8" },
  "host:staff":     { bg: "#dcfce7", color: "#166534" },
  "host:inspector": { bg: "#fef3c7", color: "#92400e" },
};

const HEADERS = ["User ID", "Role", "Assigned By", "Assigned At", "Status", "Actions"];

export default function DashboardRoles() {
  const [showAssign, setShowAssign] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);

  const { data: tenantRoles, isLoading: loadingTenantRoles } = useListTenantRolesQuery();

  useEffect(() => {
    if (!activeRoleId && tenantRoles?.data.length) {
      setActiveRoleId(tenantRoles.data[0].id);
    }
  }, [activeRoleId, tenantRoles]);

  const {
    assignments, isLoading,
    roles,
    search, setSearch,
    handleAssign, assigning,
    handleRevoke, revoking,
  } = useRoles();

  const systemRoles = tenantRoles?.data.filter((r) => r.isSystem) ?? [];
  const customRoles  = tenantRoles?.data.filter((r) => !r.isSystem) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-10"
    >
      {/* Role definitions: browse, view included permissions, edit, create custom roles.
          Layout modeled on the Risevest settings screen per your request, list on the
          left, detail/edit panel on the right, same component used for host Settings. */}
      <div className="flex flex-col gap-4">
        <Title
          title="Roles & Permissions"
          description="Define what each role can access. Click a role to view or edit its permissions."
          action={
            <button
              onClick={() => setShowCreateRole(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-full text-xs transition-opacity hover:opacity-80 shrink-0"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
            >
              <Plus size={14} />
              Create Custom Role
            </button>
          }
        />

        {loadingTenantRoles ? (
          <div className="h-[60vh] rounded-2xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />
        ) : (
          <SettingsLayout
            headerName="Roles"
            headerSubtitle={`${(tenantRoles?.data.length ?? 0)} total`}
            activeKey={activeRoleId}
            onSelect={(key) => setActiveRoleId(key || null)}
            panelTitle={tenantRoles?.data.find((r) => r.id === activeRoleId)?.name}
            groups={[
              { title: "System Roles", items: systemRoles.map((r) => ({ key: r.id, label: r.name, icon: Shield })) },
              ...(customRoles.length > 0
                ? [{ title: "Custom Roles", items: customRoles.map((r) => ({ key: r.id, label: r.name, icon: Shield })) }]
                : []),
            ]}
          >
            {activeRoleId && <RoleDetailPanel roleId={activeRoleId} />}
          </SettingsLayout>
        )}
      </div>

      {/* User -> role assignments, unchanged from before. */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <Title title="Team Assignments" description="Assign roles to the people on your team." />
          <button
            onClick={() => setShowAssign(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-full text-xs transition-opacity hover:opacity-80 shrink-0"
            style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
          >
            <UserPlus size={14} />
            Assign Role
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by user ID or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 px-3 text-xs border rounded-lg outline-none w-64"
          style={{ borderColor: "var(--color-fog)", color: "var(--color-ink)" }}
        />

        <div className="border rounded-xl overflow-x-auto" style={{ borderColor: "var(--color-fog)" }}>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-fog)" }}>
                {HEADERS.map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs uppercase whitespace-nowrap"
                      style={{ color: "var(--color-muted-stone)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "var(--color-fog)" }}>
                    {HEADERS.map((h) => (
                      <td key={h} className="px-5 py-4">
                        <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#f2f0ed", width: "70%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs"
                      style={{ color: "var(--color-muted-stone)" }}>
                    No role assignments yet. Click "Assign Role" to add a team member.
                  </td>
                </tr>
              ) : (
                assignments.map((a) => {
                  const cfg = ROLE_COLORS[a.roleSlug] ?? { bg: "#f2f0ed", color: "#4c4c4c" };
                  return (
                    <tr key={a.id} className="border-b last:border-0 transition-colors hover:bg-[#fafaf9]"
                        style={{ borderColor: "var(--color-fog)" }}>
                      <td className="px-5 py-3 text-xs font-mono" style={{ color: "var(--color-muted-stone)" }}>
                        {a.userId}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                              style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                          {a.roleName}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--color-muted-stone)" }}>
                        {a.assignedBy}
                      </td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: "var(--color-muted-stone)" }}>
                        {formatDate(a.assignedAt)}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          a.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                        }`}>
                          {a.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleRevoke(a.userId)}
                          disabled={revoking}
                          className="p-1.5 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-30"
                          style={{ color: "#dc2626" }}
                          title="Revoke role"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAssign && (
        <AssignRoleModal
          roles={roles}
          onClose={() => setShowAssign(false)}
          onSubmit={handleAssign}
          isSaving={assigning}
        />
      )}

      {showCreateRole && (
        <CreateRoleModal
          onClose={() => setShowCreateRole(false)}
          onCreated={(roleId) => {
            setShowCreateRole(false);
            setActiveRoleId(roleId);
          }}
        />
      )}
    </motion.div>
  );
}