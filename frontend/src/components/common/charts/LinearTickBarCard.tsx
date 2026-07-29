export interface LinearTickSegment {
  label: string;
  value: number;
  color: string; // e.g. "#17191c", "#777b86", "#c8c6c1", darkest = largest share by convention
}

interface Props {
  title:       string;
  totalValue:  string;
  trend?:      { value: number; delta?: string; label?: string };
  distributionLabel?: string;
  segments:    LinearTickSegment[];
  icon?:       React.ReactNode;
}

// Matches the Total Assets reference: a big total + trend, then a row
// of many small tick bars proportionally shaded left-to-right by each
// segment's real share of the total (not decorative, unlike the radial
// version), then a legend with each segment's value and percentage.
export default function LinearTickBarCard({ title, totalValue, trend, distributionLabel = "Distribution", segments, icon }: Props) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const TICK_COUNT = 40;

  // Which segment each tick index falls into, based on cumulative share.
  const tickColors = Array.from({ length: TICK_COUNT }, (_, i) => {
    const cumulativeAtTick = (i + 0.5) / TICK_COUNT;
    let running = 0;
    for (const s of segments) {
      running += s.value / total;
      if (cumulativeAtTick <= running) return s.color;
    }
    return segments[segments.length - 1]?.color ?? "#e8e6e3";
  });

  return (
    <div className="border rounded-xl p-4" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-sm bold" style={{ color: "#17191c" }}>{title}</p>
      </div>

      <p className="text-2xl bold" style={{ color: "#17191c" }}>{totalValue}</p>
      {trend && (
        <p className="text-xs mt-1">
          <span className="bold" style={{ color: trend.value >= 0 ? "#16a34a" : "#dc2626" }}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>{" "}
          {trend.delta && <span style={{ color: trend.value >= 0 ? "#16a34a" : "#dc2626" }}>{trend.delta}</span>}{" "}
          <span style={{ color: "#a3a6af" }}>{trend.label ?? "vs last month"}</span>
        </p>
      )}

      <p className="text-xs bold mt-4 mb-2" style={{ color: "#17191c" }}>{distributionLabel}</p>
      <div className="flex items-end gap-[3px]" style={{ height: 28 }}>
        {tickColors.map((color, i) => (
          <div key={i} className="flex-1 rounded-sm" style={{ height: "100%", backgroundColor: color }} />
        ))}
      </div>

      <div className="flex flex-col mt-4">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs py-2 border-b last:border-0" style={{ borderColor: "#f2f0ed" }}>
            <span className="flex items-center gap-2" style={{ color: "#4c4c4c" }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span>
              <span className="bold" style={{ color: "#17191c" }}>
                {s.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>{" "}
              <span style={{ color: "#a3a6af" }}>({Math.round((s.value / total) * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}