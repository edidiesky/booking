export interface StatCardConfig {
  label: string;
  value: string;
  sub?: string;
  color: string;
  bg: string;
  /**
   * 0–100, optional. Only pass this if there's a real, meaningful
   * ratio behind this specific card, e.g. this card is one part of a
   * known whole (bookings this status / total bookings), or a real
   * progress-toward-target number. If the card is a standalone total
   * with nothing to divide it by (revenue, a raw count), leave this
   * undefined, the tick bar renders as a plain accent stripe instead
   * of fabricating a percentage that isn't real.
   */
  fillPercent?: number;
}

interface Props {
  cards: StatCardConfig[];
  isLoading?: boolean;
  growthPct?: number;
  growthLabel?: string;
  growthTooltip?: string;
}

const GRID_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

const TICK_COUNT = 20;

function TickBar({ fillPercent, color }: { fillPercent: number | undefined; color: string }) {
  if (fillPercent === undefined) {
    return (
      <div className="flex items-end gap-[2px]" style={{ height: 14 }}>
        <div className="flex-1 rounded-sm" style={{ height: "100%", backgroundColor: color, opacity: 0.25 }} />
      </div>
    );
  }

  const filledTicks = Math.round((Math.min(100, Math.max(0, fillPercent)) / 100) * TICK_COUNT);
  return (
    <div className="flex items-end gap-[2px]" style={{ height: 14 }}>
      {Array.from({ length: TICK_COUNT }, (_, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{ height: "100%", backgroundColor: i < filledTicks ? color : "#e8e6e3" }}
        />
      ))}
    </div>
  );
}

/**
 * Overview stat cards
 */
export default function StatsOverview({
  cards
}: Props) {
  const gridClass = GRID_CLASS[Math.min(cards.length, 4)] ?? GRID_CLASS[3];

  return (
    <div className="rounded-3xl border border-[var(--color-fog)] bg-[#f5f5f3] overflow-hidden px-1 pt-6 pb-1">
      {/* {growthPct !== undefined && (
        <div className="flex items-center justify-end px-4 pb-3">
          <span
            title={growthTooltip}
            className="text-xs lg:text-[13px]  medium px-2.5 py-1 rounded-full"
            style={{
              color: growthPct >= 0 ? "#166534" : "#991b1b",
              backgroundColor: growthPct >= 0 ? "#dcfce7" : "#fee2e2",
            }}
          >
            {growthPct >= 0 ? "+" : ""}{growthPct}% {growthLabel}
          </span>
        </div>
      )} */}

      <div
        className={`w-full grid gap-4 ${gridClass} rounded-3xl bg-white divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-fog)]`}
      >
        {cards.map(({ label, value, sub, color, fillPercent }) => (
          <div
            key={label}
            className="flex h-36 lg:h-36 items-start flex-col justify-between gap-3 px-5 py-4"
          >
            <p
              className="text-[13px] uppercase medium"
              style={{ color: "var(--color-muted-stone)" }}
            >
              {label}
            </p>
            <div className="w-full flex flex-col gap-2">
              <h4
                className="text-2xl mt-1 bold lg:text-3xl"
                style={{ color: "var(--color-ink)" }}
              >
                {value}
              </h4>
              <TickBar fillPercent={fillPercent} color={color} />
              <p
                className="text-[13px] medium"
                style={{ color: "var(--color-muted-stone)" }}
              >
                {sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}