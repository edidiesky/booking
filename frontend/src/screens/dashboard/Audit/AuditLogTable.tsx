import {
  Lock,
  Plus,
  Pencil,
  Trash2,
  Ban,
  Flag,
  Check,
  Mail,
  X,
  RefreshCw,
  Circle,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import type { AuditEvent } from "./types";
import { parseAction, type ActionVisual } from "./actionStyles";

interface Props {
  events: AuditEvent[];
  isLoading: boolean;
  search: string;
  onSelect: (event: AuditEvent) => void;
}

const HEADERS = ["Date / Time", "Activity", "Target", "Role"] as const;

function ActionIcon({ icon, color }: { icon: ActionVisual["icon"]; color: string }) {
  const props = { size: 11, strokeWidth: 2.5, style: { color } as const };
  switch (icon) {
    case "plus":
      return <Plus {...props} />;
    case "pencil":
      return <Pencil {...props} />;
    case "trash":
      return <Trash2 {...props} />;
    case "ban":
      return <Ban {...props} />;
    case "flag":
      return <Flag {...props} />;
    case "check":
      return <Check {...props} />;
    case "mail":
      return <Mail {...props} />;
    case "x":
      return <X {...props} />;
    case "refresh":
      return <RefreshCw {...props} />;
    default:
      return <Circle {...props} />;
  }
}

function actorLabel(e: AuditEvent): string {
  if (e.actorName?.trim()) return e.actorName.trim();
  if (e.actorEmail?.trim()) return e.actorEmail.split("@")[0] ?? e.actorEmail;
  if (e.actorType === "system") return "System";
  if (e.actorId) return `User ${e.actorId.slice(0, 8)}`;
  return "System";
}

function targetLabel(e: AuditEvent): string {
  if (e.affectedUserEmail) return e.affectedUserEmail;
  if (e.targetId) {
    if (e.targetId.includes("@") || (e.targetId.includes("-") && e.targetId.length < 24)) {
      return e.targetId;
    }
    if (e.targetId.length > 16) return `${e.targetId.slice(0, 12)}…`;
    return e.targetId;
  }
  if (e.targetType) return e.targetType;
  return "—";
}

function roleLabel(e: AuditEvent): string {
  const fromMeta =
    (e.metadata?.["actorRole"] as string | undefined) ||
    (e.metadata?.["role"] as string | undefined) ||
    (e.metadata?.["actor_role"] as string | undefined);
  if (fromMeta) return fromMeta;
  if (e.actorType === "system") return "System";
  if (e.actorType === "api_key") return "API key";
  if (e.actorType === "impersonation") return "Impersonation";
  return "Member";
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${date} ${time.toLowerCase()}`;
  } catch {
    return iso;
  }
}

export default function AuditLogTable({
  events,
  isLoading,
  search,
  onSelect,
}: Props) {
  return (
    <div className="border border-[#e8e6e3] rounded-xl overflow-hidden bg-white">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[#e8e6e3] bg-[#fafaf9]">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-sm font-medium text-[#a3a6af] tracking-wide whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-[#f2f0ed]">
                {HEADERS.map((h) => (
                  <td key={h} className="px-5 py-4">
                    <div className="h-4 rounded animate-pulse bg-[#f2f0ed] w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : events.length === 0 ? (
            <tr>
              <td colSpan={HEADERS.length} className="px-5 py-12">
                <EmptyState
                  title="No audit events"
                  description={
                    search
                      ? `No results for "${search}"`
                      : "Actions on this workspace will show up here."
                  }
                />
              </td>
            </tr>
          ) : (
            events.map((e) => {
              const { visual, resource } = parseAction(e.action);
              return (
                <tr
                  key={e.id}
                  onClick={() => onSelect(e)}
                  className="border-b border-[#f2f0ed] last:border-0 cursor-pointer hover:bg-[#fafaf9] transition-colors"
                >
                  <td className="px-5 py-3.5 whitespace-nowrap text-[#17191c] tabular-nums">
                    {formatDateTime(e.occurredAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="text-[#17191c] font-medium truncate max-w-[9rem]">
                        {actorLabel(e)}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium whitespace-nowrap"
                        style={{ color: visual.color, backgroundColor: visual.bg }}
                      >
                        <ActionIcon icon={visual.icon} color={visual.color} />
                        {visual.label}
                      </span>
                      <span className="text-[#777b86] truncate">{resource}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="underline underline-offset-4 truncate block max-w-[20rem]">
                      {targetLabel(e)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-[#777b86]">
                      <Lock size={13} className="text-[#c4c6ce] shrink-0" />
                      <span className="text-[#17191c]">{roleLabel(e)}</span>
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}