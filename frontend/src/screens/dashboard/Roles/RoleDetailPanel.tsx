import { useState, useEffect } from "react";
import { X, Plus, Users } from "lucide-react";
import { useGetRoleDetailQuery, useUpdateRolePermissionsMutation } from "@/redux/services/roleApi";
import { showToast } from "@/components/common/Toast";
import type { Permission } from "@/types/api";

function groupByCategory(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});
}

interface Props {
  roleId: string;
}

export default function RoleDetailPanel({ roleId }: Props) {
  const { data, isLoading } = useGetRoleDetailQuery(roleId);
  const [updatePermissions, { isLoading: saving }] = useUpdateRolePermissionsMutation();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (data?.data) {
      setSelectedIds(new Set(data.data.includedPermissions.map((p) => p.id)));
    }
  }, [data?.data.role.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || !data) {
    return <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />;
  }

  const { role, includedPermissions, availablePermissions, members } = data.data;
  const allPermissions = [...includedPermissions, ...availablePermissions];
  const grouped = groupByCategory(allPermissions);

  const originalIds = new Set(includedPermissions.map((p) => p.id));
  const dirty =
    selectedIds.size !== originalIds.size ||
    [...selectedIds].some((id) => !originalIds.has(id));

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      await updatePermissions({ roleId, permissionIds: [...selectedIds] }).unwrap();
      showToast("Role updated.", "success");
    } catch { /* errorMiddleware */ }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-sm bold" style={{ color: "var(--color-ink)" }}>{role.name}</h4>
          {role.isSystem && (
            <span className="text-[10px] bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f2f0ed", color: "#4c4c4c" }}>
              System role
            </span>
          )}
        </div>
        {role.description && (
          <p className="text-xs mt-1" style={{ color: "#777b86" }}>{role.description}</p>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs" style={{ color: "#777b86" }}>
        <Users size={13} />
        {members.length === 0
          ? "No team members with this role"
          : `${members.length} team member${members.length === 1 ? "" : "s"} with this role`}
      </div>
      {members.length > 0 && (
        <div className="flex flex-wrap gap-2 -mt-3">
          {members.map((m) => (
            <span key={m.userId} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "#f2f0ed", color: "var(--color-ink)" }}>
              {[m.firstName, m.lastName].filter(Boolean).join(" ") || m.email || m.userId}
            </span>
          ))}
        </div>
      )}

      <div className="border-t pt-5" style={{ borderColor: "#f2f0ed" }}>
        <p className="text-xs bold mb-4" style={{ color: "#166534" }}>Included Permissions</p>
        <div className="flex flex-col gap-5">
          {Object.entries(grouped).map(([category, perms]) => (
            <div key={category}>
              <p className="text-xs bold mb-2" style={{ color: "var(--color-ink)" }}>{category}</p>
              <div className="flex flex-wrap gap-2">
                {perms.map((p) => {
                  const included = selectedIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggle(p.id)}
                      title={p.description}
                      className="flex items-center gap-1.5 text-xs bold px-3 py-1.5 rounded-full border transition-colors"
                      style={
                        included
                          ? { backgroundColor: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" }
                          : { backgroundColor: "transparent", color: "#a3a6af", borderColor: "#e8e6e3" }
                      }
                    >
                      {p.action} {p.resource.replace(/_/g, " ")}
                      {included ? <X size={12} /> : <Plus size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {dirty && (
        <div className="sticky bottom-0 flex items-center justify-end gap-3 pt-4 border-t bg-white" style={{ borderColor: "#f2f0ed" }}>
          <button
            onClick={() => setSelectedIds(originalIds)}
            className="text-xs bold px-4 py-2"
            style={{ color: "#777b86" }}
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bold px-5 py-2 rounded-full disabled:opacity-50"
            style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
          >
            {saving ? "Saving..." : "Update Role"}
          </button>
        </div>
      )}
    </div>
  );
}