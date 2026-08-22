import { useState, useEffect } from "react";
import { Plus, Shield } from "lucide-react";
import Title from "@/components/dashboard/common/Title";
import SettingsLayout from "@/components/dashboard/common/SettingsLayout";
import CreateRoleModal from "../CreateRoleModal";
import RoleDetailPanel from "../RoleDetailPanel";
import { useListTenantRolesQuery } from "@/redux/services/roleApi";

type RoleScope = "system" | "custom";

// Role list + detail/edit, with System Roles and Custom Roles as separate
// sub-tabs, only one list showing at a time, instead of both grouped
// into one scrollable nav list.
export default function RolesPermissionsTab() {
  const [scope, setScope] = useState<RoleScope>("system");
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);

  const { data: tenantRoles, isLoading } = useListTenantRolesQuery();

  const systemRoles = tenantRoles?.data.filter((r) => r.isSystem) ?? [];
  const customRoles  = tenantRoles?.data.filter((r) => !r.isSystem) ?? [];
  const visibleRoles = scope === "system" ? systemRoles : customRoles;

  // Reset the selected role whenever the scope tab changes, or if the
  // currently selected role isn't in the visible list (e.g. after
  // switching scope), pick the first one in the new list.
  useEffect(() => {
    if (!visibleRoles.some((r) => r.id === activeRoleId)) {
      setActiveRoleId(visibleRoles[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, tenantRoles]);

  const scopeTabs: { key: RoleScope; label: string; count: number }[] = [
    { key: "system", label: "System Roles", count: systemRoles.length },
    { key: "custom", label: "Custom Roles",  count: customRoles.length },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Title
        title="Roles & Permissions"
        description="Define what each role can access. Click a role to view or edit its permissions."
        action={
          <button
            onClick={() => setShowCreateRole(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-full text-xs lg:text-[13px]   transition-opacity hover:opacity-80 shrink-0"
            style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
          >
            <Plus size={14} />
            Create Custom Role
          </button>
        }
      />

      <div className="flex items-center gap-2">
        {scopeTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setScope(t.key)}
            className="h-8 px-4 rounded-full text-xs lg:text-[13px]     transition-colors"
            style={{
              backgroundColor: scope === t.key ? "var(--color-ink)" : "transparent",
              color: scope === t.key ? "var(--color-canvas)" : "var(--color-muted-stone)",
              border: scope === t.key ? "none" : "1px solid #e8e6e3",
            }}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-[60vh] rounded-2xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />
      ) : visibleRoles.length === 0 ? (
        <div className="rounded-xl border p-10 text-center text-xs" style={{ borderColor: "#e8e6e3", color: "var(--color-muted-stone)" }}>
          {scope === "custom"
            ? 'No custom roles yet. Click "Create Custom Role" to add one.'
            : "No system roles found."}
        </div>
      ) : (
        <SettingsLayout
          headerName={scope === "system" ? "System Roles" : "Custom Roles"}
          headerSubtitle={`${visibleRoles.length} total`}
          activeKey={activeRoleId}
          onSelect={(key) => setActiveRoleId(key || null)}
          panelTitle={visibleRoles.find((r) => r.id === activeRoleId)?.name}
          groups={[
            { title: scope === "system" ? "System Roles" : "Custom Roles",
              items: visibleRoles.map((r) => ({ key: r.id, label: r.name, icon: Shield })) },
          ]}
        >
          {activeRoleId && <RoleDetailPanel roleId={activeRoleId} />}
        </SettingsLayout>
      )}

      {showCreateRole && (
        <CreateRoleModal
          onClose={() => setShowCreateRole(false)}
          onCreated={(roleId) => {
            setShowCreateRole(false);
            setScope("custom");
            setActiveRoleId(roleId);
          }}
        />
      )}
    </div>
  );
}