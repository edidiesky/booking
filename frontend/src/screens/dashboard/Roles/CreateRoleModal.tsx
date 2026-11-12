import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";
import { slide } from "@/constants/framer";
import {
  useListRolesQuery,
  useCreateCustomRoleMutation,
  useGetRoleDetailQuery,
} from "@/redux/services/roleApi";
import { showToast } from "@/components/common/Toast";

interface Props {
  onClose: () => void;
  onCreated: (roleId: string) => void;
}

type Perm = {
  id: string;
  resource: string;
  action: string;
  description?: string;
  category: string;
};

function permissionLabel(p: Perm): string {
  const resource = p.resource.replace(/_/g, " ");
  return `Can ${p.action} ${resource}`;
}

function permissionSlug(p: Perm): string {
  return `${p.resource}.${p.action}`;
}

export default function CreateRoleModal({ onClose, onCreated }: Props) {
  const { data: systemRoles } = useListRolesQuery();
  const hostAdminId = systemRoles?.data.find((r) => r.slug === "host:admin")?.id;
  const { data: permsSource, isLoading: loadingPerms } = useGetRoleDetailQuery(
    hostAdminId ?? "",
    { skip: !hostAdminId },
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createRole, { isLoading: creating }] = useCreateCustomRoleMutation();

  const allPermissions: Perm[] = useMemo(() => {
    if (!permsSource) return [];
    const map = new Map<string, Perm>();
    for (const p of [
      ...permsSource.data.includedPermissions,
      ...permsSource.data.availablePermissions,
    ]) {
      map.set(p.id, p);
    }
    return [...map.values()];
  }, [permsSource]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allPermissions;
    return allPermissions.filter((p) => {
      const hay = `${permissionLabel(p)} ${permissionSlug(p)} ${p.category} ${p.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allPermissions, search]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Perm[]>>((acc, p) => {
      (acc[p.category] ??= []).push(p);
      return acc;
    }, {});
  }, [filtered]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllInCategory = (perms: Perm[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = perms.every((p) => next.has(p.id));
      if (allOn) perms.forEach((p) => next.delete(p.id));
      else perms.forEach((p) => next.add(p.id));
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
    } catch {
      /* errorMiddleware */
    }
  };

  const canSubmit = name.trim().length > 0 && selected.size > 0 && !creating;

  return (
    <div className="fixed inset-0 z-[5000] flex h-[100vh] w-full items-end justify-center bg-[#16161639] px-4 backdrop-blur-sm md:items-center">
      <motion.div
        variants={slide}
        initial="initial"
        animate="enter"
        exit="exit"
        className="relative flex w-full max-w-[440px] flex-col overflow-hidden rounded-2xl border border-[#e8e6e3] bg-white shadow-xl"
        style={{ maxHeight: "min(85vh, 640px)" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#eef0f3] px-5 pb-4 pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold tracking-tight text-[#0f172a]">
              Create custom role
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-[#64748b]">
              Name the role and pick exactly which actions it can perform.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          {/* Name / description */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">
                Role name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Can manage bookings"
                className="h-10 rounded-lg border border-[#e8e6e3] px-3 text-[13px] text-[#0f172a] outline-none transition-shadow placeholder:text-[#94a3b8] focus:border-[#c7cdd6] focus:ring-2 focus:ring-[#e8e6e3]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wide text-[#94a3b8]">
                Description <span className="normal-case opacity-70">(optional)</span>
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short note for your team"
                className="h-10 rounded-lg border border-[#e8e6e3] px-3 text-[13px] text-[#0f172a] outline-none transition-shadow placeholder:text-[#94a3b8] focus:border-[#c7cdd6] focus:ring-2 focus:ring-[#e8e6e3]"
              />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search permissions"
              className="h-10 w-full rounded-lg border border-[#e8e6e3] bg-[#fafafa] py-2 pl-9 pr-3 text-[13px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#c7cdd6] focus:bg-white focus:ring-2 focus:ring-[#e8e6e3]"
            />
          </div>

          {/* Permission groups */}
          <div className="flex flex-col gap-5 pb-1">
            {loadingPerms && (
              <div className="flex items-center justify-center gap-2 py-8 text-[13px] text-[#64748b]">
                <Loader2 size={14} className="animate-spin" />
                Loading permissions…
              </div>
            )}

            {!loadingPerms && Object.keys(grouped).length === 0 && (
              <p className="py-6 text-center text-[13px] text-[#94a3b8]">
                No permissions match “{search}”.
              </p>
            )}

            {Object.entries(grouped).map(([category, perms]) => {
              const allSelected = perms.every((p) => selected.has(p.id));
              const someSelected = perms.some((p) => selected.has(p.id));

              return (
                <div key={category} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-[#0f172a]">
                      {category}
                    </p>
                    <button
                      type="button"
                      onClick={() => selectAllInCategory(perms)}
                      className="text-[12px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                    >
                      {allSelected ? "Clear" : someSelected ? "Select all" : "Select all"}
                    </button>
                  </div>

                  <ul className="flex flex-col gap-0.5">
                    {perms.map((p) => {
                      const checked = selected.has(p.id);
                      return (
                        <li key={p.id}>
                          <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[#f8fafc]">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggle(p.id)}
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#cbd5e1] text-[#2563eb] focus:ring-[#2563eb]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-[13px] font-medium leading-snug text-[#0f172a]">
                                {permissionLabel(p)}
                              </span>
                              <span className="mt-0.5 block text-[11px] leading-snug text-[#94a3b8]">
                                {p.description?.trim() || permissionSlug(p)}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#eef0f3] bg-white px-5 py-3.5">
          <p className="text-[12px] text-[#94a3b8]">
            {selected.size} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="h-9 rounded-lg border border-[#e8e6e3] px-4 text-[13px] font-medium text-[#475569] transition-colors hover:bg-[#f8fafc] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canSubmit}
              className="flex h-9 items-center gap-2 rounded-lg bg-[#0f172a] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {creating ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Creating…
                </>
              ) : (
                "Create role"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}