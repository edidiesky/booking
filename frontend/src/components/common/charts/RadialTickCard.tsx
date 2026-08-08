import { useState } from "react";

export interface RadialTickSegment {
  label: string;
  value: number;
  trend?: number;
  color?: string;
}

interface Props {
  title:      string;
  totalValue: string | number;
  totalLabel?: string;
  segments:   RadialTickSegment[];
  icon?:      React.ReactNode;
}

// Fallback palette, used only when a segment doesn't specify its own
// color. Distinct hues, not a grayscale ramp, matching the actual ask.
const DEFAULT_COLORS = ["#1e40af", "#166534", "#991b1b", "#92400e", "#5b21b6"];

export default function RadialTickCard({ title, totalValue, totalLabel = "Total", segments, icon }: Props) {
  const [hovered, setHovered] = useState<RadialTickSegment | null>(null);
  const TICK_COUNT = 48;
  const RADIUS_OUTER = 70;
  const RADIUS_INNER = 58;
  const CENTER = 80;

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  // Resolved once, per segment, and reused for both the ticks and the
  // legend below, single source of truth instead of two separate color
  // arrays that can silently drift apart.
  const colorFor = (segment: RadialTickSegment, index: number) =>
    segment.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = (i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2;
    const x1 = CENTER + RADIUS_INNER * Math.cos(angle);
    const y1 = CENTER + RADIUS_INNER * Math.sin(angle);
    const x2 = CENTER + RADIUS_OUTER * Math.cos(angle);
    const y2 = CENTER + RADIUS_OUTER * Math.sin(angle);

    const cumulativeAtTick = (i + 0.5) / TICK_COUNT;
    let running = 0;
    let segment = segments[segments.length - 1];
    let segmentIndex = segments.length - 1;
    for (let s = 0; s < segments.length; s++) {
      running += segments[s].value / total;
      if (cumulativeAtTick <= running) { segment = segments[s]; segmentIndex = s; break; }
    }

    return { x1, y1, x2, y2, segment, color: colorFor(segment, segmentIndex) };
  });

  return (
    <div className="border rounded-xl p-4 flex flex-col gap-4" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs lg:text-[13px]" style={{ color: "#17191c" }}>{title}</p>
      </div>

      <div className="relative flex items-center justify-center py-4" style={{ height: 180 }}>
        {hovered && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-white border rounded-xl shadow-lg px-3 py-2 z-10 whitespace-nowrap pointer-events-none"
            style={{ borderColor: "#e8e6e3" }}
          >
            <p className="text-xs lg:text-[13px] flex items-center gap-1.5" style={{ color: "#17191c" }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorFor(hovered, segments.indexOf(hovered)) }} />
              {hovered.label}
            </p>
            <p className="text-xs lg:text-[13px]mt-0.5">
              <span style={{ color: "#4c4c4c" }}>{hovered.value.toLocaleString()}</span>{" "}
              {hovered.trend !== undefined && (
                <span style={{ color: hovered.trend >= 0 ? "#16a34a" : "#dc2626" }}>
                  {hovered.trend >= 0 ? "+" : ""}{hovered.trend}%
                </span>
              )}
            </p>
          </div>
        )}

        <svg width={240} height={200} viewBox="0 0 160 160">
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.color}
              strokeWidth={2}
              strokeLinecap="round"
              style={{ cursor: "default" }}
              onMouseEnter={() => setHovered(t.segment)}
              onMouseLeave={() => setHovered(null)}
              pointerEvents="stroke"
            />
          ))}
          {ticks.map((t, i) => (
            <line
              key={`hit-${i}`}
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="transparent"
              strokeWidth={10}
              strokeLinecap="round"
              onMouseEnter={() => setHovered(t.segment)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div className="absolute flex flex-col items-center pointer-events-none">
          <p className="text-[11px] uppercase tracking-widest" style={{ color: "#a3a6af" }}>{totalLabel}</p>
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
            className="flex items-center justify-between text-xs lg:text-[13px] py-1 cursor-default"
          >
            <span className="flex items-center gap-2" style={{ color: "#4c4c4c" }}>
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colorFor(s, i) }} />
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