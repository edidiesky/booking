import { useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import Title from "@/components/dashboard/common/Title";
import { formatDate } from "@/utils/formatDate";
import AssignRoleModal from "../AssignRoleModal";
import { useRoles } from "../hooks/useRoles";

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  "host:admin":     { bg: "#dbeafe", color: "#1d4ed8" },
  "host:staff":     { bg: "#dcfce7", color: "#166534" },
  "host:inspector": { bg: "#fef3c7", color: "#92400e" },
};

const HEADERS = ["User ID", "Role", "Assigned By", "Assigned At", "Status", "Actions"];

export default function TeamManagementTab() {
  const [showAssign, setShowAssign] = useState(false);

  const {
    assignments, isLoading,
    roles,
    search, setSearch,
    handleAssign, assigning,
    handleRevoke, revoking,
  } = useRoles();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <Title title="Team Management" description="Assign roles to the people on your team." />
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

      {showAssign && (
        <AssignRoleModal
          roles={roles}
          onClose={() => setShowAssign(false)}
          onSubmit={handleAssign}
          isSaving={assigning}
        />
      )}
    </div>
  );
}