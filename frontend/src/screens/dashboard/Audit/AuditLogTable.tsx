import { EmptyState } from "@/components/common/EmptyState";
import type { AuditEvent } from "./types";

interface Props {
  events: AuditEvent[];
  isLoading: boolean;
  search: string;
  onSelect: (event: AuditEvent) => void;
}

const HEADERS = [
  "Occurred",
  "Actor",
  "Action",
  "Changed fields",
  "Target",
  "Outcome",
];

export default function AuditLogTable({
  events,
  isLoading,
  search,
  onSelect,
}: Props) {
  return (
    <div className="border border-[#e8e6e3] overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#e8e6e3]">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-5 py-3 text-left text-xs lg:text-xs text-[#a3a6af] uppercase whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
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
              <td
                colSpan={HEADERS.length}
                className="px-5 py-10 text-center text-xs lg:text-[13px] text-[#a3a6af]"
              >
                <EmptyState
                  title="Audit Search Results"
                  description={`No audit events found{search ? for "${search}"`}
                />
              </td>
            </tr>
          ) : (
            events.map((e) => (
              <tr
                key={e.id}
                onClick={() => onSelect(e)}
                className="border-b border-[#f2f0ed] last:border-0 cursor-pointer hover:bg-[#f9f8f6]"
              >
                <td className="px-5 py-4 whitespace-nowrap text-[#17191c]">
                  {new Date(e.occurredAt).toLocaleString()}
                </td>
                <td className="px-5 py-4 text-[#17191c]">
                  {e.actorEmail ??
                    (e.actorId
                      ? `erased user (${e.actorId.slice(0, 8)}...)`
                      : "system")}
                </td>
                <td
                  className={`px-5 py-4 font-mono ${e.outcome === "denied" ? "text-red-600" : "text-[#17191c]"}`}
                >
                  {e.action}
                </td>
                <td className="px-5 py-4 text-[#777b86]">
                  {e.changedFields?.join(", ") ?? "\u2014"}
                </td>
                <td className="px-5 py-4 text-[#777b86]">
                  {e.targetType
                    ? `${e.targetType}${e.targetId ? `:${e.targetId.slice(0, 8)}` : ""}`
                    : "\u2014"}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] ${e.outcome === "denied" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
                  >
                    {e.outcome}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
