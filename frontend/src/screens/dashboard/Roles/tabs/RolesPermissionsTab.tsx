import { useState, useEffect } from "react";
import { Plus, Shield } from "lucide-react";
import SettingsLayout from "@/components/dashboard/common/SettingsLayout";
import CreateRoleModal from "../CreateRoleModal";
import RoleDetailPanel from "../RoleDetailPanel";
import { useListTenantRolesQuery } from "@/redux/services/roleApi";
import { EmptyState } from "@/components/common/EmptyState";

type RoleScope = "system" | "custom";

export default function RolesPermissionsTab() {
  const [scope, setScope] = useState<RoleScope>("system");
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);

  const { data: tenantRoles, isLoading } = useListTenantRolesQuery();

  const systemRoles = tenantRoles?.data.filter((r) => r.isSystem) ?? [];
  const customRoles = tenantRoles?.data.filter((r) => !r.isSystem) ?? [];
  const visibleRoles = scope === "system" ? systemRoles : customRoles;

  useEffect(() => {
    if (!visibleRoles.some((r) => r.id === activeRoleId)) {
      setActiveRoleId(visibleRoles[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, tenantRoles]);

  const scopeTabs: { key: RoleScope; label: string; count: number }[] = [
    { key: "system", label: "System Roles", count: systemRoles.length },
    { key: "custom", label: "Custom Roles", count: customRoles.length },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Compact header — no competing page-level title under Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p
          className="text-xs lg:text-[13px] max-w-xl"
          style={{ color: "var(--color-muted-stone)" }}
        >
          Define what each role can access. Select a role to view or edit its
          permissions.
        </p>
        <button
          type="button"
          onClick={() => setShowCreateRole(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-full text-xs lg:text-[13px] transition-opacity hover:opacity-80 shrink-0 self-start sm:self-auto"
          style={{
            backgroundColor: "var(--color-ink)",
            color: "var(--color-canvas)",
          }}
        >
          <Plus size={14} />
          Create Custom Role
        </button>
      </div>

      {/* Scope pills */}
      <div className="flex items-center gap-2">
        {scopeTabs.map((t) => {
          const active = scope === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setScope(t.key)}
              className="h-8 px-4 rounded-full text-xs lg:text-[13px] transition-colors"
              style={{
                backgroundColor: active ? "var(--color-ink)" : "transparent",
                color: active
                  ? "var(--color-canvas)"
                  : "var(--color-muted-stone)",
                border: active ? "none" : "1px solid #e8e6e3",
              }}
            >
              {t.label} ({t.count})
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div
          className="h-[52vh] rounded-2xl animate-pulse"
          style={{ backgroundColor: "#f2f0ed" }}
        />
      ) : visibleRoles.length === 0 ? (
        <div
          className="rounded-xl border p-10 text-center text-xs"
          style={{ borderColor: "#e8e6e3", color: "var(--color-muted-stone)" }}
        >
          <EmptyState
            title="Roles"
            description={
              scope === "custom"
                ? 'No custom roles yet. Click "Create Custom Role" to add one.'
                : "No system roles found."
            }
          />
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "#e8e6e3" }}
        >
          <SettingsLayout
            headerName={scope === "system" ? "System Roles" : "Custom Roles"}
            headerSubtitle={`${visibleRoles.length} total`}
            activeKey={activeRoleId}
            onSelect={(key) => setActiveRoleId(key || null)}
            panelTitle={visibleRoles.find((r) => r.id === activeRoleId)?.name}
            groups={[
              {
                title: scope === "system" ? "System Roles" : "Custom Roles",
                items: visibleRoles.map((r) => ({
                  key: r.id,
                  label: r.name,
                  icon: Shield,
                })),
              },
            ]}
          >
            {activeRoleId && <RoleDetailPanel roleId={activeRoleId} />}
          </SettingsLayout>
        </div>
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