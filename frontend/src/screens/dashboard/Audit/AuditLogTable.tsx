import { Table, TableHeader, TableBody } from "@/components/ui/table";
import type { AuditEvent } from "./types";
import { EmptyState } from "@/components/common/EmptyState";

interface Props {
  events: AuditEvent[];
  isLoading: boolean;
  onSelect: (event: AuditEvent) => void;
}

export default function AuditLogTable({ events, isLoading, onSelect }: Props) {
  if (isLoading)
    return (
      <div className="p-6 text-xs text-muted-foreground">
        Loading audit events...
      </div>
    );
  if (events.length === 0)
    return (
      <div className="p-6 text-xs text-muted-foreground">
        <EmptyState
          title="Audit Logs events"
          description={"No audit events match these filters."}
        />
      </div>
    );

  return (
    <Table>
      <TableHeader>
        <tr className="text-left text-xs text-muted-foreground border-b">
          <th className="py-2 pr-4 font-medium">Occurred</th>
          <th className="py-2 pr-4 font-medium">Actor</th>
          <th className="py-2 pr-4 font-medium">Action</th>
          <th className="py-2 pr-4 font-medium">Changed fields</th>
          <th className="py-2 pr-4 font-medium">Target</th>
          <th className="py-2 pr-4 font-medium">Outcome</th>
        </tr>
      </TableHeader>
      <TableBody>
        {events.map((e) => (
          <tr
            key={e.id}
            onClick={() => onSelect(e)}
            className="cursor-pointer border-b last:border-0 hover:bg-muted/40 text-xs"
          >
            <td className="py-3 pr-4 whitespace-nowrap">
              {new Date(e.occurredAt).toLocaleString()}
            </td>
            <td className="py-3 pr-4">
              {e.actorEmail ??
                (e.actorId
                  ? `erased user (${e.actorId.slice(0, 8)}...)`
                  : "system")}
            </td>
            <td
              className={`py-3 pr-4 font-mono ${e.outcome === "denied" ? "text-red-600" : ""}`}
            >
              {e.action}
            </td>
            <td className="py-3 pr-4">
              {e.changedFields?.join(", ") ?? "\u2014"}
            </td>
            <td className="py-3 pr-4">
              {e.targetType
                ? `${e.targetType}${e.targetId ? `:${e.targetId.slice(0, 8)}` : ""}`
                : "\u2014"}
            </td>
            <td className="py-3 pr-4">
              <span
                className={`px-2 py-0.5 rounded text-[11px] ${e.outcome === "denied" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
              >
                {e.outcome}
              </span>
            </td>
          </tr>
        ))}
      </TableBody>
    </Table>
  );
}
