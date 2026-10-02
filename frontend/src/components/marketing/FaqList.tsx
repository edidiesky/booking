import { useId, useState } from "react";
import { Plus } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

/** Disclosure list. Height animates via grid rows; icon rotates 45deg. */
export default function FaqList({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  return (
    <ul className="border-t border-[var(--mk-line)]">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <li key={it.q} className="border-b border-[var(--mk-line)]">
            <h3>
              <button
                type="button"
                id={`${base}-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`${base}-a-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-[1.125rem] font-[580] tracking-[-0.01em]"
              >
                {it.q}
                <Plus
                  size={20}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="shrink-0 text-[var(--mk-muted)]"
                  style={{
                    rotate: isOpen ? "45deg" : "0deg",
                    transition: "rotate 200ms var(--mk-ease-out)",
                  }}
                />
              </button>
            </h3>
            <div
              id={`${base}-a-${i}`}
              role="region"
              aria-labelledby={`${base}-q-${i}`}
              className="mk-collapse"
              data-open={isOpen}
            >
              <div>
                <p className="mk-body max-w-[64ch] pb-6">{it.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
