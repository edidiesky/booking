import Drawer from "@/components/common/Drawer";
import DrawerSection from "@/components/common/DrawerSection";
import DrawerField from "@/components/common/DrawerField";
import type { AuditEvent } from "./types";

interface Props {
  event: AuditEvent;
  onClose: () => void;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "\u2014";
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}

export default function AuditLogDetailModal({ event, onClose }: Props) {
  return (
    <Drawer title={event.action} subtitle={`sequence ${event.sequence}`} onClose={onClose}>
      {event.changedFields && event.changedFields.length > 0 && (
        <DrawerSection label="Changed">
          <DrawerField label="changed_fields" value={event.changedFields.join(", ")} />
          {event.changedFields.map((field) => (
            <DrawerField key={field} label={field} value={`${formatValue(event.beforeValue?.[field])} \u2192 ${formatValue(event.afterValue?.[field])}`} />
          ))}
        </DrawerSection>
      )}

      {event.outcome === "denied" && event.denialReason && (
        <DrawerSection label="Denied">
          <DrawerField label="reason" value={event.denialReason} />
        </DrawerSection>
      )}

      <DrawerSection label="Who">
        <DrawerField label="actor.type" value={event.actorType} />
        <DrawerField label="actor" value={event.actorEmail ? `${event.actorName ?? ""} \u00b7 ${event.actorEmail}`.trim() : "erased user"} />
        {event.actorId && <DrawerField label="actor.id" value={event.actorId} />}
      </DrawerSection>

      {(event.targetType || event.affectedUserId) && (
        <DrawerSection label="What">
          {event.targetType && <DrawerField label="target.type" value={event.targetType} />}
          {event.targetId && <DrawerField label="target.id" value={event.targetId} />}
          {event.affectedUserId && <DrawerField label="affected_user" value={event.affectedUserEmail ?? "erased user"} />}
        </DrawerSection>
      )}

      <DrawerSection label="Record">
        <DrawerField label="id" value={event.id} />
        <DrawerField label="sequence" value={event.sequence} />
        {event.requestId && <DrawerField label="request_id" value={event.requestId} />}
        <DrawerField label="tenant_id" value={event.tenantId} />
        <DrawerField label="occurred_at" value={event.occurredAt} />
        <DrawerField label="recorded_at" value={event.recordedAt} />
        {event.originIp && <DrawerField label="origin.ip" value={event.originIp} />}
        {event.originCountry && <DrawerField label="origin.country" value={event.originCountry} />}
      </DrawerSection>
    </Drawer>
  );
}