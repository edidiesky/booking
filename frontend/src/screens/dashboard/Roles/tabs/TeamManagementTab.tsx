import { useState } from "react";
import {
  UserPlus,
  ShieldCheck,
  KeyRound,
  UserCog,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import AssignRoleModal from "../AssignRoleModal";
import InviteMemberModal from "../InviteMemberModal";
import { useRoles } from "../hooks/useRoles";
import { EmptyState } from "@/components/common/EmptyState";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import type { UserRoleAssignment } from "@/types/api";

const HEADERS = [
  "",
  "Name",
  "Email",
  "Role",
  "Last Login",
  "2FA Status",
  "Action",
];

interface Props {
  onManageRoles?: () => void;
}

function initials(first?: string, last?: string, email?: string) {
  if (first || last) {
    return `${(first?.[0] ?? "").toUpperCase()}${(last?.[0] ?? "").toUpperCase()}` || "?";
  }
  return (email?.[0] ?? "?").toUpperCase();
}

function avatarColor(seed: string) {
  const palette = [
    "#dbeafe",
    "#fce7f3",
    "#dcfce7",
    "#fef3c7",
    "#ede9fe",
    "#ffedd5",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * 17) % palette.length;
  }
  return palette[hash];
}

function TwoFactorBadge({ enabled }: { enabled?: boolean }) {
  if (enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs lg:text-[13px] font-medium text-green-700">
        <CheckCircle2 size={14} className="text-green-600" />
        Enabled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs lg:text-[13px] font-medium text-amber-700">
      <AlertCircle size={14} className="text-amber-500" />
      Disabled
    </span>
  );
}

export default function TeamManagementTab({ onManageRoles }: Props) {
  const [showAssign, setShowAssign] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const {
    assignments,
    isLoading,
    roles,
    search,
    setSearch,
    handleAssign,
    assigning,
    handleRevoke,
    handleInvite,
    inviting,
  } = useRoles();

  const allSelected =
    assignments.length > 0 && selected.size === assignments.length;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(assignments.map((a) => a.userId)));
  };

  const toggleOne = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const rowActions = (a: UserRoleAssignment) => [
    {
      label: "Enforce 2FA",
      icon: ShieldCheck,
      onClick: () => {
        /* reserved */
      },
    },
    {
      label: "Reset Password",
      icon: KeyRound,
      onClick: () => {
        /* reserved */
      },
    },
    {
      label: "Change role",
      icon: UserCog,
      onClick: () => setShowAssign(true),
      separator: true,
    },
    {
      label: "Remove admin",
      icon: Trash2,
      onClick: () => handleRevoke(a.userId),
      variant: "danger" as const,
    },
  ];

  const displayName = (a: UserRoleAssignment) => {
    const name = [a.firstName, a.lastName].filter(Boolean).join(" ").trim();
    return name || a.email || a.userId;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search members"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 px-3 text-xs lg:text-[13px] border rounded-lg outline-none w-full sm:w-64"
            style={{ borderColor: "var(--color-fog)", color: "var(--color-ink)" }}
          />
          <button
            type="button"
            className="h-9 px-3 rounded-lg border text-xs lg:text-[13px] inline-flex items-center gap-1.5 shrink-0 hover:bg-[#fafaf9]"
            style={{ borderColor: "var(--color-fog)", color: "var(--color-ink)" }}
          >
            <Filter size={14} />
            Filter
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            className="h-9 px-3 rounded-lg border text-xs lg:text-[13px] inline-flex items-center gap-1.5 hover:bg-[#fafaf9]"
            style={{ borderColor: "var(--color-fog)", color: "var(--color-ink)" }}
          >
            <ShieldCheck size={14} />
            Enforce 2FA
          </button>
          <button
            type="button"
            onClick={onManageRoles}
            className="h-9 px-3 rounded-lg border text-xs lg:text-[13px] inline-flex items-center gap-1.5 hover:bg-[#fafaf9]"
            style={{ borderColor: "var(--color-fog)", color: "var(--color-ink)" }}
          >
            <UserCog size={14} />
            Manage roles
          </button>
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="h-9 px-4 rounded-lg text-xs lg:text-[13px] text-white inline-flex items-center gap-1.5 transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#6d28d9" }}
          >
            <UserPlus size={14} />
            Invite member
          </button>
        </div>
      </div>

      <div
        className="border rounded-xl overflow-x-auto"
        style={{ borderColor: "var(--color-fog)" }}
      >
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--color-fog)" }}>
              {HEADERS.map((h, i) => (
                <th
                  key={h || `h-${i}`}
                  className="px-4 py-3 text-left text-xs font-medium whitespace-nowrap"
                  style={{ color: "var(--color-muted-stone)" }}
                >
                  {i === 0 ? (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-gray-300"
                      aria-label="Select all"
                    />
                  ) : (
                    h
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr
                  key={i}
                  className="border-b"
                  style={{ borderColor: "var(--color-fog)" }}
                >
                  {HEADERS.map((h, j) => (
                    <td key={h || `s-${j}`} className="px-4 py-4">
                      <div
                        className="h-4 rounded animate-pulse"
                        style={{ backgroundColor: "#f2f0ed", width: "70%" }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : assignments.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="px-5 py-12">
                  <EmptyState
                    title="No team members"
                    description='Invite a teammate with “Invite member” or assign a role to an existing user.'
                  />
                </td>
              </tr>
            ) : (
              assignments.map((a) => {
                const name = displayName(a);
                const seed = a.email || a.userId;
                return (
                  <tr
                    key={a.id}
                    className="border-b last:border-0 transition-colors hover:bg-[#fafaf9]"
                    style={{ borderColor: "var(--color-fog)" }}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(a.userId)}
                        onChange={() => toggleOne(a.userId)}
                        className="rounded border-gray-300"
                        aria-label={`Select ${name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {a.profileImage ? (
                          <img
                            src={a.profileImage}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                            style={{
                              backgroundColor: avatarColor(seed),
                              color: "#374151",
                            }}
                          >
                            {initials(a.firstName, a.lastName, a.email)}
                          </div>
                        )}
                        <span
                          className="text-xs lg:text-[13px] font-medium truncate"
                          style={{ color: "var(--color-ink)" }}
                        >
                          {name}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-xs lg:text-[13px] whitespace-nowrap"
                      style={{ color: "var(--color-muted-stone)" }}
                    >
                      {a.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 text-xs lg:text-[13px]"
                        style={{ color: "var(--color-ink)" }}
                      >
                        <ShieldCheck size={13} className="text-[#777b86]" />
                        {a.roleName}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-xs lg:text-[13px] whitespace-nowrap"
                      style={{ color: "var(--color-muted-stone)" }}
                    >
                      {a.lastActiveAt ? formatDate(a.lastActiveAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <TwoFactorBadge enabled={a.twoFactorEnabled} />
                    </td>
                    <td className="px-4 py-3">
                      <RowActionsMenu actions={rowActions(a)} />
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

      {showInvite && (
        <InviteMemberModal
          roles={roles}
          onClose={() => setShowInvite(false)}
          onSubmit={handleInvite}
          isSaving={inviting}
        />
      )}
    </div>
  );
}