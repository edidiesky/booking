import { useListAuditEventsQuery } from "@/redux/services/auditEventApi";

interface Props {
  userId: string;
}

export default function ProfileActivityTab({ userId }: Props) {
  const { data: events = [], isLoading } = useListAuditEventsQuery({ actor: userId, limit: 30 });

  if (isLoading) {
    return <div className="p-6 text-xs text-[#a3a6af]">Loading activity...</div>;
  }

  if (events.length === 0) {
    return <div className="p-6 text-xs text-[#a3a6af]">No recorded activity for this user yet.</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      {events.map((e) => (
        <div key={e.id} className="flex gap-3">
          <div className="flex flex-col items-center pt-1">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: e.outcome === "denied" ? "#dc2626" : "#22c55e" }}
            />
          </div>
          <div className="min-w-0 flex-1 pb-3 border-b last:border-0" style={{ borderColor: "#f2f0ed" }}>
            <p className="text-sm text-[#17191c] font-mono">{e.action}</p>
            {e.changedFields && e.changedFields.length > 0 && (
              <p className="text-xs text-[#a3a6af] mt-0.5">
                Changed: {e.changedFields.join(", ")}
              </p>
            )}
            <p className="text-xs text-[#a3a6af] mt-0.5">
              {new Date(e.occurredAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}