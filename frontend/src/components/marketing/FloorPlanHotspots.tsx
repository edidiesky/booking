import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { EASE_OUT } from "@/design/motion";

export interface Hotspot {
  id: string;
  x: number; // percentage of the plan width
  y: number; // percentage of the plan height
  title: string;
  body: string;
}

interface Props {
  spots: Hotspot[];
}

/**
 * "What a verified listing has to show", drawn as a floor plan with points.
 * Two views like the reference: the plan, and the same items as a checklist.
 * Points are real buttons: keyboard reachable, label read on focus.
 */
export default function FloorPlanHotspots({ spots }: Props) {
  const [view, setView] = useState<"plan" | "list">("plan");
  const [active, setActive] = useState<string>(spots[0]?.id ?? "");
  const current = spots.find((s) => s.id === active) ?? spots[0];

  return (
    <div className="mk-card overflow-hidden p-2">
      <div className="flex items-center justify-between px-3 pb-2 pt-2">
        <p className="text-[0.9375rem] font-[600]">Two-bed apartment, Lekki</p>
        <div role="tablist" aria-label="View" className="inline-flex rounded-full bg-[var(--mk-paper)] p-1">
          {(["plan", "list"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className="h-8 rounded-full px-3.5 text-[0.8125rem] font-[560] transition-[background-color,color,box-shadow] duration-150 ease-out"
              style={{
                background: view === v ? "var(--mk-surface)" : "transparent",
                boxShadow: view === v ? "var(--mk-shadow-border)" : "none",
                color: view === v ? "var(--mk-ink)" : "var(--mk-muted)",
              }}
            >
              {v === "plan" ? "Floor plan" : "Checklist"}
            </button>
          ))}
        </div>
      </div>

      <div className="relative rounded-[14px] bg-[var(--mk-paper)]">
        {view === "plan" ? (
          <div className="relative">
            <Plan />
            {spots.map((s) => {
              const on = s.id === active;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  onMouseEnter={() => setActive(s.id)}
                  onFocus={() => setActive(s.id)}
                  aria-pressed={on}
                  aria-label={s.title}
                  className="absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                  style={{ left: `${s.x}%`, top: `${s.y}%` }}
                >
                  <span
                    className="grid h-6 w-6 place-items-center rounded-full ring-4"
                    style={{
                      background: on ? "var(--mk-lagoon)" : "var(--mk-surface)",
                      color: on ? "#fff" : "var(--mk-lagoon)",
                      ["--tw-ring-color" as string]: on
                        ? "color-mix(in oklch, var(--mk-lagoon) 22%, transparent)"
                        : "color-mix(in oklch, var(--mk-lagoon) 10%, transparent)",
                      boxShadow: "var(--mk-shadow-border)",
                      transition: "background-color 150ms ease, color 150ms ease",
                    }}
                  >
                    <Check size={13} strokeWidth={2.5} />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <ul className="divide-y divide-[var(--mk-line)] px-5 py-2">
            {spots.map((s) => (
              <li key={s.id} className="flex gap-3 py-3.5">
                <Check size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-[var(--mk-signal)]" />
                <div>
                  <p className="text-[0.9375rem] font-[560]">{s.title}</p>
                  <p className="text-[0.875rem] text-[var(--mk-muted)]">{s.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {view === "plan" && current && (
        <div className="min-h-[5.5rem] px-3 pb-2 pt-4" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: EASE_OUT }}
            >
              <p className="text-[1rem] font-[600]">{current.title}</p>
              <p className="mt-1 text-[0.9375rem] text-[var(--mk-muted)]">{current.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function Plan() {
  const wall = { stroke: "var(--mk-ink)", strokeWidth: 3, fill: "none", strokeLinejoin: "round" as const };
  const thin = { stroke: "var(--mk-faint)", strokeWidth: 1.25, fill: "none" };
  return (
    <svg viewBox="0 0 480 300" className="block h-auto w-full" aria-hidden="true">
      <rect x="20" y="20" width="440" height="260" rx="4" {...wall} />
      <path d="M200 20v110M200 170v110M20 150h120M170 150h30M330 20v90M330 150v130M330 150h130" {...wall} />
      {/* furniture */}
      <rect x="44" y="40" width="80" height="64" rx="6" {...thin} />
      <rect x="44" y="196" width="80" height="62" rx="6" {...thin} />
      <rect x="350" y="40" width="90" height="56" rx="6" {...thin} />
      <rect x="230" y="200" width="76" height="40" rx="18" {...thin} />
      <circle cx="268" cy="80" r="22" {...thin} />
      <rect x="352" y="186" width="44" height="76" rx="6" {...thin} />
      <text x="54" y="128" fontSize="11" fill="var(--mk-faint)">Bedroom</text>
      <text x="54" y="276" fontSize="11" fill="var(--mk-faint)">Bedroom</text>
      <text x="230" y="140" fontSize="11" fill="var(--mk-faint)">Living</text>
      <text x="350" y="130" fontSize="11" fill="var(--mk-faint)">Kitchen</text>
      <text x="410" y="270" fontSize="11" fill="var(--mk-faint)">Bath</text>
    </svg>
  );
}
