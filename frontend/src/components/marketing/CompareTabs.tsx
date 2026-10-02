import { useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/design/motion";

export interface CompareRow {
  title: string;
  body: string;
  verdictLabel: string;
  verdict: string;
  tone: "good" | "bad";
}
export interface CompareTab {
  id: string;
  label: string;
  rows: CompareRow[];
}

/** Accessible tabs (roving tabindex, arrow keys). Panels cross-fade in 200ms. */
export default function CompareTabs({ tabs }: { tabs: CompareTab[] }) {
  const [active, setActive] = useState(0);
  const base = useId();
  const btns = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (active + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(next);
    btns.current[next]?.focus();
  };

  const tab = tabs[active];

  return (
    <div>
      <div role="tablist" aria-label="Compare" className="inline-flex rounded-full bg-[var(--mk-surface)] p-1 shadow-[var(--mk-shadow-border)]">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              btns.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${base}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={onKey}
            className="h-10 rounded-full px-4 text-[0.9375rem] font-[560] transition-[background-color,color] duration-150 ease-out"
            style={{
              background: i === active ? "var(--mk-lagoon)" : "transparent",
              color: i === active ? "#fff" : "var(--mk-muted)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`} className="mt-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={tab.id}
            className="grid gap-4 md:grid-cols-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          >
            {tab.rows.map((r) => (
              <li key={r.title} className="mk-card flex flex-col p-6">
                <p className="text-[1.125rem] font-[600] tracking-[-0.01em]">{r.title}</p>
                <p className="mk-body mt-2 flex-1">{r.body}</p>
                <p className="mt-6 flex items-baseline justify-between gap-3 border-t border-[var(--mk-line)] pt-4 text-[0.875rem]">
                  <span className="text-[var(--mk-muted)]">{r.verdictLabel}</span>
                  <span
                    className="font-[600]"
                    style={{ color: r.tone === "good" ? "var(--mk-signal)" : "#a2392f" }}
                  >
                    {r.verdict}
                  </span>
                </p>
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>
    </div>
  );
}
