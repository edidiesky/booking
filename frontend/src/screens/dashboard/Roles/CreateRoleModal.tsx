import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { slide } from "@/constants/framer";
import { useListRolesQuery, useCreateCustomRoleMutation, useGetRoleDetailQuery } from "@/redux/services/roleApi";
import { showToast } from "@/components/common/Toast";

interface Props {
  onClose: () => void;
  onCreated: (roleId: string) => void;
}

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
    <div className="h-[100vh] bg-[#16161639] inset-0 backdrop-blur-sm w-full fixed top-0 left-0 z-[5000] flex items-end md:items-center justify-end md:justify-center px-4">
      <motion.div
        variants={slide}
        initial="initial"
        animate="enter"
        exit="exit"
        className="w-full md:w-[500px] md:max-w-[550px] rounded-2xl pt-6 justify-between relative items-start flex flex-col gap-4 bg-white overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        <div className="w-full flex px-8 items-start justify-between gap-1">
          <div>
            <h3 className="text-lg text-[#17191c]">Create Custom Role</h3>
            <p className="text-xs lg:text-sm text-[#777b86] mt-1 max-w-[380px]">
              Name your role and choose exactly what it can access.
            </p>
          </div>
        </div>

        <div className="w-full flex-1 overflow-y-auto px-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "#777b86" }}>Role Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name your role"
              className="h-10 px-3 text-xs lg:text-sm border rounded-lg outline-none"
              style={{ borderColor: "#e8e6e3", color: "#17191c" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "#777b86" }}>Role Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your role"
              className="h-10 px-3 text-xs lg:text-sm border rounded-lg outline-none"
              style={{ borderColor: "#e8e6e3", color: "#17191c" }}
            />
          </div>

          {Object.entries(grouped).map(([category, perms]) => (
            <div key={category}>
              <p className="text-xs lg:text-sm mb-2" style={{ color: "#17191c" }}>{category}</p>
              <div className="flex flex-col gap-2">
                {perms.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-xs" style={{ color: "#17191c" }}>
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

        <div className="w-full flex px-8 py-4 border-t border-[#e8e6e3] bg-white items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="h-9 px-5 text-xs lg:text-sm rounded-full text-[#4c4c4c] border border-[#e8e6e3] hover:bg-[#f2f0ed] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !name.trim() || selected.size === 0}
            className="h-9 px-5 text-xs lg:text-sm rounded-full bg-[#17191c] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Creating...
              </>
            ) : "Create Role"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}