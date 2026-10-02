import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { ICON_SWAP } from "@/design/motion";

export interface RecordStep {
  label: string;
  detail: string;
  time: string;
}

interface Props {
  reference: string;
  title: string;
  steps: RecordStep[];
  /** Play the steps in sequence once when the tag enters view. */
  autoplay?: boolean;
  /** Controlled progress (number of completed steps). Overrides autoplay. */
  completed?: number;
  footer?: { label: string; value: string };
  className?: string;
}

const STEP_MS = 650;

/**
 * The booking record rendered as a key tag. This is the one bold element of
 * the identity: the logo, the hero and the "record" pillar all use it.
 */
export default function KeyTag({
  reference,
  title,
  steps,
  autoplay = false,
  completed,
  footer,
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotion();
  const [played, setPlayed] = useState(autoplay && !reduce ? 0 : steps.length);

  useEffect(() => {
    if (!autoplay || reduce || !inView) return;
    if (played >= steps.length) return;
    const t = window.setTimeout(() => setPlayed((p) => p + 1), played === 0 ? 350 : STEP_MS);
    return () => window.clearTimeout(t);
  }, [autoplay, reduce, inView, played, steps.length]);

  const done = completed ?? played;
  const closed = done >= steps.length;

  return (
    <div
      ref={ref}
      className={`relative rounded-[28px] bg-[var(--mk-surface)] p-2 shadow-[var(--mk-shadow-float)] ${className}`}
    >
      {/* Punched hole with a brass ring: the tag reading. */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[var(--mk-brass)] bg-[var(--mk-paper)]"
      />
      <div className="rounded-[20px] bg-[var(--mk-surface)] px-5 pb-5 pt-7 ring-1 ring-[var(--mk-line)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mk-num text-[0.8125rem] text-[var(--mk-faint)]">{reference}</p>
            <p className="mt-0.5 truncate text-[1.0625rem] font-[600] tracking-[-0.01em]">{title}</p>
          </div>
          <StatusChip closed={closed} />
        </div>

        <ol className="mt-5 flex flex-col" aria-label="Booking record">
          {steps.map((s, i) => {
            const isDone = i < done;
            const isNext = i === done;
            return (
              <li key={s.label} className="relative grid grid-cols-[22px_minmax(0,1fr)_auto] gap-x-3 pb-4 last:pb-0">
                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[10.5px] top-6 bottom-0 w-px"
                    style={{
                      background: isDone && i + 1 < done ? "var(--mk-signal)" : "var(--mk-line)",
                      transition: "background-color 300ms var(--mk-ease-out)",
                    }}
                  />
                )}
                <span
                  className="relative mt-0.5 grid h-[22px] w-[22px] place-items-center rounded-full"
                  style={{
                    background: isDone ? "var(--mk-signal)" : "var(--mk-surface)",
                    boxShadow: isDone
                      ? "none"
                      : `inset 0 0 0 1.5px ${isNext ? "var(--mk-brass)" : "var(--mk-line)"}`,
                    transition: "background-color 200ms ease-out, box-shadow 200ms ease-out",
                  }}
                >
                  <AnimatePresence initial={false}>
                    {isDone && (
                      <motion.span {...ICON_SWAP} className="grid place-items-center text-white">
                        <Check size={13} strokeWidth={2.5} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <div className="min-w-0">
                  <p
                    className="text-[0.9375rem] font-[560]"
                    style={{
                      color: isDone || isNext ? "var(--mk-ink)" : "var(--mk-faint)",
                      transition: "color 200ms ease-out",
                    }}
                  >
                    {s.label}
                  </p>
                  <p className="text-[0.8125rem] leading-snug text-[var(--mk-muted)]">{s.detail}</p>
                </div>
                <p
                  className="mk-num pt-0.5 text-[0.8125rem]"
                  style={{ color: isDone ? "var(--mk-muted)" : "transparent", transition: "color 200ms ease-out" }}
                >
                  {s.time}
                </p>
              </li>
            );
          })}
        </ol>

        {footer && (
          <div className="mt-5 flex items-center justify-between rounded-[12px] bg-[var(--mk-brass-tint)] px-4 py-3">
            <span className="text-[0.875rem] text-[#6b4d16]">{footer.label}</span>
            <span className="mk-num text-[1.0625rem] font-[650] tracking-[0.06em] text-[#4d370f]">
              {footer.value}
            </span>
          </div>
        )}
      </div>
      <span className="sr-only" aria-live="polite">
        {closed ? "Record closed" : ""}
      </span>
    </div>
  );
}

function StatusChip({ closed }: { closed: boolean }) {
  return (
    <span
      className="relative inline-flex h-7 shrink-0 items-center overflow-hidden rounded-full px-3 text-[0.8125rem] font-[560]"
      style={{
        background: closed ? "var(--mk-lagoon-tint)" : "var(--mk-brass-tint)",
        color: closed ? "var(--mk-lagoon-deep)" : "#6b4d16",
        transition: "background-color 200ms ease-out, color 200ms ease-out",
      }}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={closed ? "closed" : "open"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          {closed ? "Record closed" : "In progress"}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Shared copy: the canonical booking record shown across pages. */
export const SAMPLE_RECORD: RecordStep[] = [
  { label: "Requested", detail: "2 nights, Lekki Phase 1", time: "12:58" },
  { label: "Paid, held in escrow", detail: "Via Paystack. Not with the host yet", time: "13:02" },
  { label: "Checked in", detail: "Fri, as booked", time: "14:00" },
  { label: "Checked out", detail: "Sun, stay complete", time: "12:00" },
  { label: "Released to host", detail: "Automatically, no payout request", time: "12:01" },
];
