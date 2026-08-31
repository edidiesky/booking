import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { AuditEvent } from "./types";

interface Props {
  event: AuditEvent | null;
  onClose: () => void;
}

export default function AuditLogDetailModal({ event, onClose }: Props) {
  return (
    <AnimatePresence>
      {event && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 overflow-y-auto shadow-xl p-6"
          >
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2
                  className={` text-sm font-semibold ${event.outcome === "denied" ? "text-red-600" : ""}`}
                >
                  {event.action}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {new Date(event.occurredAt).toLocaleString()} &middot;
                  sequence {event.sequence}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {event.changedFields && event.changedFields.length > 0 && (
              <Section title="CHANGED">
                <Row
                  label="changed_fields"
                  value={event.changedFields.join(", ")}
                />
                {event.changedFields.map((field) => (
                  <Row
                    key={field}
                    label={field}
                    value={`${formatValue(event.beforeValue?.[field])} \u2192 ${formatValue(event.afterValue?.[field])}`}
                  />
                ))}
              </Section>
            )}

            {event.outcome === "denied" && event.denialReason && (
              <Section title="DENIED">
                <Row label="reason" value={event.denialReason} />
              </Section>
            )}

            <Section title="WHO">
              <Row label="actor.type" value={event.actorType} />
              <Row
                label="actor"
                value={
                  event.actorEmail
                    ? `${event.actorName ?? ""} \u00b7 ${event.actorEmail}`.trim()
                    : "erased user"
                }
                sublabel={
                  !event.actorEmail
                    ? "the identity was erased; the event was not"
                    : undefined
                }
              />
              {event.actorId && (
                <Row label="actor.id" value={event.actorId} mono />
              )}
            </Section>

            {(event.targetType || event.affectedUserId) && (
              <Section title="WHAT">
                {event.targetType && (
                  <Row label="target.type" value={event.targetType} />
                )}
                {event.targetId && (
                  <Row label="target.id" value={event.targetId} mono />
                )}
                {event.affectedUserId && (
                  <Row
                    label="affected_user"
                    value={event.affectedUserEmail ?? "erased user"}
                  />
                )}
              </Section>
            )}

            <Section title="RECORD">
              <Row label="id" value={event.id} mono />
              <Row label="sequence" value={event.sequence} />
              {event.requestId && (
                <Row label="request_id" value={event.requestId} mono />
              )}
              <Row label="tenant_id" value={event.tenantId} mono />
              <Row label="occurred_at" value={event.occurredAt} />
              <Row
                label="recorded_at"
                value={event.recordedAt}
                sublabel={
                  event.occurredAt === event.recordedAt
                    ? "the same instant: written inside the transaction"
                    : undefined
                }
              />
              {event.originIp && (
                <Row label="origin.ip" value={event.originIp} />
              )}
              {event.originCountry && (
                <Row label="origin.country" value={event.originCountry} />
              )}
            </Section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "\u2014";
  return typeof v === "object" ? JSON.stringify(v) : String(v);
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 pt-4 border-t first:border-0 first:mt-4 first:pt-0">
      <p className="text-[10px] tracking-wide font-medium text-muted-foreground mb-2">
        {title}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  sublabel,
  mono,
}: {
  label: string;
  value: string;
  sublabel?: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div>
        <span className={mono ? "" : ""}>{value}</span>
        {sublabel && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
