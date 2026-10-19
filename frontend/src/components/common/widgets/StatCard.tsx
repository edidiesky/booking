import { MeterBar } from "./MeterBar";
import { statTones } from "../statTones";
import type { StatCardProps } from "./statCard.types";

export function StatCard({
  label,
  value,
  total,
  progress,
  tone = "success",
  footnote,
}: StatCardProps) {
  const t = statTones[tone];
  const safe = Number.isFinite(progress)
    ? Math.min(1, Math.max(0, progress))
    : 0;

  return (
    <div
      className="p-5 min-h-[190px] justify-between flex flex-col gap-4 rounded-2xl border bg-white"
      style={{ borderColor: "var(--color-border, #e1e5ea)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: "var(--color-secondary, #001325)" }}
        >
          {label}
        </p>
        <span
          className={`text-xs font-semibold tabular-nums shrink-0 rounded-md px-1.5 py-0.5 ${t.pill}`}
        >
          {Math.round(safe * 100)}%
        </span>
      </div>

      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
        <span
          className="text-3xl lg:text-4xl leading-none font-semibold tracking-tight tabular-nums"
          style={{ color: "var(--color-secondary, #001325)" }}
        >
          {value}
        </span>
        {total != null && total !== "" && (
          <span className="text-sm text-[var(--color-light-steel,#66798b)]">
            {total}
          </span>
        )}
      </p>

      <div className="flex flex-col gap-2">
        <MeterBar value={safe} tone={tone} label={label} />

        {footnote && (
          <p className="flex items-center gap-1.5 text-xs text-[var(--color-light-steel,#66798b)]">
            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${t.dot}`} />
            {footnote}
          </p>
        )}
      </div>
    </div>
  );
}
