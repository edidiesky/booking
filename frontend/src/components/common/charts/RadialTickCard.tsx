import { useState } from "react";

export interface RadialTickSegment {
  label: string;
  value: number;
  trend?: number;
}

interface Props {
  title:      string;
  totalValue: string | number;
  totalLabel?: string;
  segments:   RadialTickSegment[];
  icon?:      React.ReactNode;
}

// Matches the Customer Segmentation reference exactly: a full ring of
// uniform dark tick marks (decorative, not color-coded per segment,
// the data lives in the legend and the hover tooltip, not in the ring
// itself), a centered total, and a floating tooltip that appears over
// the ring on hover of a legend row. Not a recharts preset, this
// specific tick-ring style needs raw SVG.
export default function RadialTickCard({ title, totalValue, totalLabel = "Total", segments, icon }: Props) {
  const [hovered, setHovered] = useState<RadialTickSegment | null>(null);
  const TICK_COUNT = 48;
  const RADIUS_OUTER = 70;
  const RADIUS_INNER = 58;
  const CENTER = 80;

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = (i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2;
    const x1 = CENTER + RADIUS_INNER * Math.cos(angle);
    const y1 = CENTER + RADIUS_INNER * Math.sin(angle);
    const x2 = CENTER + RADIUS_OUTER * Math.cos(angle);
    const y2 = CENTER + RADIUS_OUTER * Math.sin(angle);
    return { x1, y1, x2, y2 };
  });

  const LEGEND_COLORS = ["#17191c", "#777b86", "#c8c6c1"];

  return (
    <div className="border rounded-xl p-4" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-sm bold" style={{ color: "#17191c" }}>{title}</p>
      </div>

      <div className="relative flex items-center justify-center py-4" style={{ height: 180 }}>
        {hovered && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-white border rounded-xl shadow-lg px-3 py-2 z-10 whitespace-nowrap"
            style={{ borderColor: "#e8e6e3" }}
          >
            <p className="text-xs bold flex items-center gap-1.5" style={{ color: "#17191c" }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#17191c" }} />
              {hovered.label}
            </p>
            <p className="text-xs mt-0.5">
              <span style={{ color: "#4c4c4c" }}>{hovered.value.toLocaleString()}</span>{" "}
              {hovered.trend !== undefined && (
                <span style={{ color: hovered.trend >= 0 ? "#16a34a" : "#dc2626" }}>
                  {hovered.trend >= 0 ? "+" : ""}{hovered.trend}%
                </span>
              )}
            </p>
          </div>
        )}

        <svg width={160} height={160} viewBox="0 0 160 160">
          {ticks.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" />
          ))}
        </svg>
        <div className="absolute flex flex-col items-center pointer-events-none">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "#a3a6af" }}>{totalLabel}</p>
          <p className="text-xl bold" style={{ color: "#17191c" }}>
            {typeof totalValue === "number" ? totalValue.toLocaleString() : totalValue}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {segments.map((s, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(null)}
            className="flex items-center justify-between text-xs py-1 cursor-default"
          >
            <span className="flex items-center gap-2" style={{ color: "#4c4c4c" }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: LEGEND_COLORS[i % LEGEND_COLORS.length] }} />
              {s.label}
            </span>
            <span className="flex items-center gap-2">
              <span className="bold" style={{ color: "#17191c" }}>{s.value.toLocaleString()}</span>
              {s.trend !== undefined && (
                <span style={{ color: s.trend >= 0 ? "#16a34a" : "#dc2626" }}>
                  {s.trend >= 0 ? "+" : ""}{s.trend}%
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}