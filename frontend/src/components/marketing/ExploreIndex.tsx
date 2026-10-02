import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { NAV } from "@/config/brand";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Index of the site. Desktop: a list whose active row expands (grid 0fr to
 * 1fr, no height measuring) and drives the counter. Mobile: a snap rail whose
 * counter follows the card in view. Every row is a real link.
 */
export default function ExploreIndex() {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const rowRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const railRef = useRef<HTMLUListElement>(null);
  const [railActive, setRailActive] = useState(0);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setRailActive(Number((e.target as HTMLElement).dataset.idx));
        });
      },
      { root: rail, threshold: 0.6 },
    );
    Array.from(rail.children).forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  const onKey = (e: KeyboardEvent<HTMLAnchorElement>, i: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (i + (e.key === "ArrowDown" ? 1 : -1) + NAV.length) % NAV.length;
      setActive(next);
      rowRefs.current[next]?.focus();
    }
    if (e.key === " ") {
      e.preventDefault();
      navigate(NAV[i].to);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
      <div className="flex flex-col justify-between gap-8">
        <div>
          <p className="mk-kicker">Explore</p>
          <h2 className="mk-h2 mt-4 max-w-[12ch]">See how it all works.</h2>
          <p className="mk-lead mt-5">
            This page is the short version. Each part has its own page with the detail behind it.
          </p>
        </div>
        <Counter value={active} total={NAV.length} className="hidden lg:flex" />
        <Counter value={railActive} total={NAV.length} className="flex lg:hidden" />
      </div>

      {/* Desktop list */}
      <ul className="hidden border-t border-[var(--mk-line)] lg:block">
        {NAV.map((item, i) => {
          const open = i === active;
          return (
            <li key={item.to} className="border-b border-[var(--mk-line)]">
              <Link
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
                to={item.to}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onKeyDown={(e) => onKey(e, i)}
                className="group grid grid-cols-[3rem_minmax(0,1fr)_auto] items-start gap-x-4 py-6"
              >
                <span
                  className="mk-num pt-1.5 text-[0.9375rem] font-[600]"
                  style={{ color: open ? "var(--mk-brass)" : "var(--mk-faint)", transition: "color 150ms ease" }}
                >
                  {pad(i + 1)}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-4">
                    <span
                      className="text-[1.75rem] font-[620] tracking-[-0.025em]"
                      style={{ color: open ? "var(--mk-ink)" : "var(--mk-muted)", transition: "color 150ms ease" }}
                    >
                      {item.label}
                    </span>
                    <span className="text-[0.9375rem] text-[var(--mk-muted)]">{item.blurb}</span>
                  </span>
                  <span className="mk-collapse" data-open={open}>
                    <span>
                      <span className="mk-body block max-w-[48ch] pt-3">{item.detail}</span>
                    </span>
                  </span>
                </span>
                <span
                  className="mt-1.5 grid h-10 w-10 place-items-center rounded-full"
                  style={{
                    background: open ? "var(--mk-lagoon)" : "transparent",
                    color: open ? "#fff" : "var(--mk-muted)",
                    boxShadow: open ? "none" : "inset 0 0 0 1px var(--mk-line)",
                    transition: "background-color 150ms ease, color 150ms ease, box-shadow 150ms ease",
                  }}
                  aria-hidden="true"
                >
                  <ArrowUpRight size={18} strokeWidth={1.75} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Mobile rail */}
      <ul ref={railRef} className="mk-rail -mx-4 gap-3 px-4 pb-2 lg:hidden" style={{ scrollPaddingInline: "1rem" }}>
        {NAV.map((item, i) => (
          <li key={item.to} data-idx={i} className="w-[82%] max-w-[340px]">
            <Link to={item.to} className="mk-card flex h-full flex-col gap-3 p-6">
              <span className="mk-num text-[0.875rem] font-[600] text-[var(--mk-brass)]">{pad(i + 1)}</span>
              <span className="text-[1.5rem] font-[620] tracking-[-0.025em]">{item.label}</span>
              <span className="mk-body flex-1">{item.detail}</span>
              <span className="text-[0.9375rem] font-[560] text-[var(--mk-lagoon)]">Open {item.label.toLowerCase()}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Counter({ value, total, className = "" }: { value: number; total: number; className?: string }) {
  return (
    <p className={`mk-num items-baseline gap-2 text-[var(--mk-faint)] ${className}`} aria-hidden="true">
      <span className="relative inline-grid overflow-hidden text-[3.5rem] font-[620] leading-none tracking-[-0.04em] text-[var(--mk-ink)]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ opacity: 0, filter: "blur(4px)", y: 8 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, filter: "blur(4px)", y: -8 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          >
            {pad(value + 1)}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="text-[1.125rem]">/ {pad(total)}</span>
    </p>
  );
}
