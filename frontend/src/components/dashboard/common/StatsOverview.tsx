export interface StatCardConfig {
  label: string;
  value: string;
  sub?: string;
  color: string;
  bg: string;
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

/**
 * Overview stat cards + optional growth badge, driven entirely by numbers
 * the caller already fetched from a real backend aggregate endpoint
 * (`*.stats` routes). This component has no knowledge of where the numbers
 * came from, it just renders them, don't wire it to a client-side
 * page-local reduce, that defeats the point.
 */
export default function StatsOverview({
  cards,
}: Props) {
  const gridClass = GRID_CLASS[Math.min(cards.length, 4)] ?? GRID_CLASS[3];

  return (
    <div className="rounded-3xl border border-[var(--color-fog)] bg-[#f5f5f3] overflow-hidden px-1 pt-6 pb-1">
      <div
        className={`w-full grid gap-4 ${gridClass} rounded-3xl bg-white divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-fog)]`}
      >
        {cards.map(({ label, value, sub }) => (
          <div
            key={label}
            className="flex h-36 lg:h-36 items-start flex-col justify-between gap-3 px-5 py-4"
          >
            <p
              className="text-xs uppercase medium"
              style={{ color: "var(--color-muted-stone)" }}
            >
              {label}
            </p>
            <div className="w-full flex flex-col gap-3">
              <h4
                className="text-xl mt-1 bold lg:text-3xl"
                style={{ color: "var(--color-ink)" }}
              >
                {value}
              </h4>
              <p
                className="text-xs medium"
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
