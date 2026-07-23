import { useState } from "react";
import { X } from "lucide-react";
import { useListRolesQuery, useCreateCustomRoleMutation, useGetRoleDetailQuery } from "@/redux/services/roleApi";
import { showToast } from "@/components/common/Toast";

interface Props {
  onClose: () => void;
  onCreated: (roleId: string) => void;
}

// Reuses an existing system role's permission list as the checklist source
// (host:admin has every permission relevant to a tenant), rather than a
// second endpoint just for "all permissions", since role detail already
// returns includedPermissions + availablePermissions for any role id.
export default function CreateRoleModal({ onClose, onCreated }: Props) {
  const { data: systemRoles } = useListRolesQuery();
  const hostAdminId = systemRoles?.data.find((r) => r.slug === "host:admin")?.id;
  const { data: permsSource } = useGetRoleDetailQuery(hostAdminId ?? "", { skip: !hostAdminId });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createRole, { isLoading: creating }] = useCreateCustomRoleMutation();

  const allPermissions = permsSource
    ? [...permsSource.data.includedPermissions, ...permsSource.data.availablePermissions]
    : [];
  const grouped = allPermissions.reduce<Record<string, typeof allPermissions>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim() || selected.size === 0) return;
    try {
      const result = await createRole({
        name: name.trim(),
        description: description.trim() || undefined,
        permissionIds: [...selected],
      }).unwrap();
      showToast("Custom role created.", "success");
      onCreated(result.data.role.id);
    } catch { /* errorMiddleware */ }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden flex flex-col" style={{ maxHeight: "85vh" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e8e6e3" }}>
          <h4 className="text-sm bold" style={{ color: "var(--color-ink)" }}>Create Custom Role</h4>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#f2f0ed]">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs bold" style={{ color: "var(--color-ink)" }}>Role Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name your role"
              className="h-10 px-3 text-xs border rounded-lg outline-none"
              style={{ borderColor: "#e8e6e3" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs bold" style={{ color: "var(--color-ink)" }}>Role Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your role"
              className="h-10 px-3 text-xs border rounded-lg outline-none"
              style={{ borderColor: "#e8e6e3" }}
            />
          </div>

          {Object.entries(grouped).map(([category, perms]) => (
            <div key={category}>
              <p className="text-xs bold mb-2" style={{ color: "var(--color-ink)" }}>{category}</p>
              <div className="flex flex-col gap-2">
                {perms.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-xs" style={{ color: "var(--color-ink)" }}>
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                    <span className="bold">Can</span> {p.action} {p.resource.replace(/_/g, " ")}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "#e8e6e3" }}>
          <button onClick={onClose} className="text-xs bold px-4 py-2" style={{ color: "#777b86" }}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim() || selected.size === 0}
            className="text-xs bold px-5 py-2 rounded-full disabled:opacity-50"
            style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
          >
            {creating ? "Creating..." : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}