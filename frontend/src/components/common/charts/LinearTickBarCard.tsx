import { useState } from "react";

export interface LinearTickSegment {
  label: string;
  value: number;
  color: string;
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Which segment each tick index falls into, based on cumulative share,
  // tracked as the full segment (not just color) so hover can show its
  // name and percentage, matching the "Product Sales (65%)" tooltip in
  // the reference.
  const tickSegments = Array.from({ length: TICK_COUNT }, (_, i) => {
    const cumulativeAtTick = (i + 0.5) / TICK_COUNT;
    let running = 0;
    for (const s of segments) {
      running += s.value / total;
      if (cumulativeAtTick <= running) return s;
    }
    return segments[segments.length - 1];
  });

  return (
    <div className="border rounded-xl p-4" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-xs lg:text-[13px]" style={{ color: "#17191c" }}>{title}</p>
      </div>

      <p className="text-2xl bold" style={{ color: "#17191c" }}>{totalValue}</p>
      {trend && (
        <p className="text-xs lg:text-[13px]mt-1">
          <span className="bold" style={{ color: trend.value >= 0 ? "#16a34a" : "#dc2626" }}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>{" "}
          {trend.delta && <span style={{ color: trend.value >= 0 ? "#16a34a" : "#dc2626" }}>{trend.delta}</span>}{" "}
          <span style={{ color: "#a3a6af" }}>{trend.label ?? "vs last month"}</span>
        </p>
      )}

      <p className="text-xs lg:text-[13px]  mt-4 mb-2" style={{ color: "#17191c" }}>{distributionLabel}</p>
      <div className="relative">
        {hoveredIdx !== null && (
          <div
            className="absolute -top-9 bg-white border rounded-lg shadow-lg px-2.5 py-1.5 z-10 whitespace-nowrap text-xs lg:text-[13px]  pointer-events-none"
            style={{
              borderColor: "#e8e6e3",
              color: "#17191c",
              left: `${((hoveredIdx + 0.5) / TICK_COUNT) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            {tickSegments[hoveredIdx]?.label} ({Math.round(((tickSegments[hoveredIdx]?.value ?? 0) / total) * 100)}%)
          </div>
        )}
        <div className="flex items-end gap-[3px]" style={{ height: 28 }}>
          {tickSegments.map((s, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 rounded-sm cursor-default"
              style={{ height: "100%", backgroundColor: s?.color ?? "#e8e6e3" }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col mt-4">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs lg:text-[13px]  py-3 border-b last:border-0" style={{ borderColor: "#f2f0ed" }}>
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