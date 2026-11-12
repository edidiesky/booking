import { statTones } from "../statTones";
import type { StatTone } from "./statCard.types";

const TICKS = 20;

export function MeterBar({
  value,
  tone = "success",
  label,
}: {
  value: number; // 0–1
  tone?: StatTone;
  label?: string;
}) {
  const pct = Math.min(1, Math.max(0, value));
  const filled = Math.round(pct * TICKS);
  const color = statTones[tone].meter;

  return (
    <div
      className="flex gap-[2px] h-3 w-full"
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: TICKS }, (_, i) => (
        <div
          key={i}
          className="flex-1 rounded-xs"
          style={{
            backgroundColor: i < filled ? color : "var(--color-border, #e1e5ea)",
          }}
        />
      ))}
    </div>
  );
}