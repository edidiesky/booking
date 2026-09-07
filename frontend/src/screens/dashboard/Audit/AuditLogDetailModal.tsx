import Drawer from "@/components/common/Drawer";
import DrawerSection from "@/components/common/DrawerSection";
import DrawerField from "@/components/common/DrawerField";
import Avatar from "@/components/common/Avatar";
import { CheckCircle2, XCircle } from "lucide-react";
import type { AuditEvent } from "./types";
import { titleFromAction } from "./actionStyles";

interface Props {
  event: AuditEvent;
  onClose: () => void;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "\u2014";
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function actorDisplayName(e: AuditEvent): string {
  if (e.actorName?.trim()) return e.actorName.trim();
  if (e.actorEmail?.trim()) return e.actorEmail;
  if (e.actorType === "system") return "System";
  return e.actorId ? `User ${e.actorId.slice(0, 8)}` : "Unknown";
}

function roleLabel(e: AuditEvent): string | null {
  const fromMeta =
    (e.metadata?.["actorRole"] as string | undefined) ||
    (e.metadata?.["role"] as string | undefined) ||
    (e.metadata?.["actor_role"] as string | undefined);
  if (fromMeta) return fromMeta;
  if (e.actorType === "system") return "System";
  if (e.actorType === "api_key") return "API key";
  if (e.actorType === "impersonation") return "Impersonation";
  return null;
}

function deviceFromMeta(e: AuditEvent): string | null {
  return (
    (e.metadata?.["device"] as string | undefined) ||
    (e.metadata?.["userAgent"] as string | undefined) ||
    null
  );
}

function locationFromEvent(e: AuditEvent): string | null {
  if (e.originCountry) return e.originCountry;
  return (e.metadata?.["location"] as string | undefined) ?? null;
}

export default function AuditLogDetailModal({ event, onClose }: Props) {
  const title = titleFromAction(event.action);
  const name = actorDisplayName(event);
  const role = roleLabel(event);
  const location = locationFromEvent(event);
  const device = deviceFromMeta(event);
  const isSuccess = event.outcome === "allowed";

  return (
    <Drawer
      title={title}
      subtitle={`sequence ${event.sequence}`}
      onClose={onClose}
    >
      {/* Actor: avatar, name, role chip, time */}
      <div className="px-6 pt-2 pb-4 flex flex-col items-start gap-3 border-b border-[#f2f0ed]">
        <Avatar
          email={event.actorEmail}
          name={name}
          size={64}
          className="ring-1 ring-[#e8e6e3]"
        />
        <div className="min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#17191c] truncate">
              {name}
            </p>
            {role && (
              <span className="inline-flex items-center rounded-full bg-[#e8f0ff] text-[#1a56ff] text-[11px] font-medium px-2 py-0.5">
                {role}
              </span>
            )}
          </div>
          <p className="text-xs text-[#a3a6af] mt-0.5">
            {formatDateTime(event.occurredAt)}
          </p>
          {event.actorEmail && event.actorName && (
            <p className="text-xs text-[#777b86] mt-0.5 truncate">
              {event.actorEmail}
            </p>
          )}
        </div>
      </div>

      <DrawerSection label="Overview">
        <DrawerField
          label="Status"
          value={
            isSuccess ? (
              <span className="inline-flex items-center gap-1.5 text-[#166534]">
                <CheckCircle2 size={14} className="text-[#22c55e]" />
                Success
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[#991b1b]">
                <XCircle size={14} className="text-[#ef4444]" />
                {event.denialReason
                  ? `Denied \u00b7 ${event.denialReason}`
                  : "Denied"}
              </span>
            )
          }
        />
        {(event.targetType || event.targetId || event.affectedUserEmail) && (
          <DrawerField
            label="Target"
            value={
              event.affectedUserEmail ||
              event.targetId ||
              event.targetType ||
              "\u2014"
            }
          />
        )}
        {event.targetType && (
          <DrawerField label="Target type" value={event.targetType} />
        )}
        {location && <DrawerField label="Location" value={location} />}
        {device && <DrawerField label="Device" value={device} />}
        {event.originIp && (
          <DrawerField label="IP address" value={event.originIp} />
        )}
        <DrawerField label="Event ID" value={event.id} />
      </DrawerSection>

      {event.changedFields && event.changedFields.length > 0 && (
        <DrawerSection label="Changes">
          <DrawerField label="Fields" value={event.changedFields.join(", ")} />
          {event.changedFields.map((field) => (
            <DrawerField
              key={field}
              label={field.replace(/_/g, " ")}
              value={`${formatValue(event.beforeValue?.[field])} \u2192 ${formatValue(event.afterValue?.[field])}`}
            />
          ))}
        </DrawerSection>
      )}

      {event.outcome === "denied" && event.denialReason && (
        <DrawerSection label="Denied">
          <DrawerField label="Reason" value={event.denialReason} />
        </DrawerSection>
      )}

      <DrawerSection label="Who">
        <DrawerField label="Actor type" value={event.actorType} />
        <DrawerField
          label="Actor"
          value={
            event.actorEmail
              ? `${event.actorName ?? ""} \u00b7 ${event.actorEmail}`.trim()
              : "erased user"
          }
        />
        {event.actorId && (
          <DrawerField label="Actor ID" value={event.actorId} />
        )}
        {role && <DrawerField label="Role" value={role} />}
      </DrawerSection>

      {(event.targetType || event.affectedUserId) && (
        <DrawerSection label="What">
          {event.targetType && (
            <DrawerField label="Target type" value={event.targetType} />
          )}
          {event.targetId && (
            <DrawerField label="Target ID" value={event.targetId} />
          )}
          {event.affectedUserId && (
            <DrawerField
              label="Affected user"
              value={event.affectedUserEmail ?? "erased user"}
            />
          )}
        </DrawerSection>
      )}

      <DrawerSection label="Record">
        <DrawerField label="ID" value={event.id} />
        <DrawerField label="Sequence" value={event.sequence} />
        {event.requestId && (
          <DrawerField label="Request ID" value={event.requestId} />
        )}
        <DrawerField label="Tenant ID" value={event.tenantId} />
        <DrawerField
          label="Occurred at"
          value={formatDateTime(event.occurredAt)}
        />
        <DrawerField
          label="Recorded at"
          value={formatDateTime(event.recordedAt)}
        />
        {event.originIp && (
          <DrawerField label="Origin IP" value={event.originIp} />
        )}
        {event.originCountry && (
          <DrawerField label="Origin country" value={event.originCountry} />
        )}
      </DrawerSection>
    </Drawer>
  );
}
