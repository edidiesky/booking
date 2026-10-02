import type { ReactNode } from "react";
import { useActiveStep } from "@/hooks/useActiveStep";

export interface StepItem {
  id: string;
  label: string;
  title: string;
  body: string;
  facts?: string[];
  proof?: string;
  visual: ReactNode;
}

interface Props {
  steps: StepItem[];
}

/**
 * Desktop (lg+): text scrolls, the visual column is sticky and cross-fades to
 * the active step. Below lg: each step is followed by its own visual.
 * Text exists once in the DOM; visuals are decorative (aria-hidden inside).
 */
export default function StickySteps({ steps }: Props) {
  const { active, register } = useActiveStep<HTMLDivElement>(steps.length);

  return (
    <div className="grid gap-x-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <ol className="relative flex flex-col">
        {steps.map((s, i) => (
          <li key={s.id} id={s.id} className="scroll-mt-24">
            <div
              ref={register(i)}
              data-step={i}
              className="flex flex-col gap-5 py-10 lg:min-h-[78vh] lg:justify-center lg:py-0"
            >
              <div
                className="flex flex-col gap-4 transition-opacity duration-300 ease-out lg:data-[inactive=true]:opacity-35"
                data-inactive={i !== active}
              >
                <p className="flex items-baseline gap-3">
                  <span className="mk-num text-[0.9375rem] font-[600] text-[var(--mk-brass)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mk-kicker">{s.label}</span>
                </p>
                <h3 className="mk-h2 max-w-[14ch]">{s.title}</h3>
                <p className="mk-lead">{s.body}</p>
                {s.facts && (
                  <ul className="mt-1 flex flex-col divide-y divide-[var(--mk-line)] border-y border-[var(--mk-line)]">
                    {s.facts.map((f) => (
                      <li key={f} className="py-3 text-[0.9375rem] text-[var(--mk-ink)]">
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                {s.proof && (
                  <p className="text-[0.9375rem] font-[560] text-[var(--mk-lagoon)]">{s.proof}</p>
                )}
              </div>
              <div className="mt-4 lg:hidden">{s.visual}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className="relative hidden lg:block" aria-hidden="true">
        <div className="sticky top-[calc(50vh-15rem)] h-[30rem]">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className="absolute inset-0 flex items-center"
              style={{
                opacity: i === active ? 1 : 0,
                scale: i === active ? "1" : "0.98",
                transitionProperty: "opacity, scale",
                transitionDuration: "300ms",
                transitionTimingFunction: "var(--mk-ease-out)",
                pointerEvents: i === active ? "auto" : "none",
              }}
            >
              <div className="w-full">{s.visual}</div>
            </div>
          ))}
          <div className="absolute -bottom-10 left-0 flex gap-2">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className="h-1 rounded-full"
                style={{
                  width: i === active ? 28 : 12,
                  background: i === active ? "var(--mk-lagoon)" : "var(--mk-line)",
                  transitionProperty: "width, background-color",
                  transitionDuration: "250ms",
                  transitionTimingFunction: "var(--mk-ease-out)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
