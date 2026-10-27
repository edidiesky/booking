import { useState } from "react";

export interface RadialTickSegment {
  label: string;
  value: number;
  trend?: number;
  color?: string;
}

interface Props {
  title: string;
  totalValue: string | number;
  totalLabel?: string;
  segments: RadialTickSegment[];
  icon?: React.ReactNode;
  /** Soft surface behind the card — matches other dashboard widgets */
  background?: string;
}

const DEFAULT_COLORS = ["#c4b5fd", "#7c3aed", "#166534", "#b45309", "#1d4ed8"];

export default function RadialTickCard({
  title,
  totalValue,
  totalLabel = "Total",
  segments,
}: Props) {
  const [hovered, setHovered] = useState<RadialTickSegment | null>(null);

  const TICK_COUNT = 56;
  const RADIUS_OUTER = 72;
  const RADIUS_INNER = 52;
  const CENTER = 80;
  const STROKE = 4; // was 2 → more visual weight

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

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
      if (cumulativeAtTick <= running) {
        segment = segments[s];
        segmentIndex = s;
        break;
      }
    }

    return {
      x1,
      y1,
      x2,
      y2,
      segment,
      color: colorFor(segment, segmentIndex),
    };
  });

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 border"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: "#17191c" }}>
          {title}
        </p>
      </div>

      <div
        className="relative flex items-center justify-center"
        style={{ height: 200 }}
      >
        {/* Soft disc behind the ticks so the ring reads as a widget, not a line art */}
        <div
          className="absolute rounded-full"
          style={{
            width: 150,
            height: 150,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 70%, transparent 100%)",
            boxShadow: "inset 0 0 0 1px rgba(22, 101, 52, 0.06)",
          }}
        />

        {hovered && (
          <div
            className="absolute top-1 left-1/2 z-10 -translate-x-1/2 rounded-lg px-3 py-1.5 text-xs shadow-md"
            style={{
              background: "#17191c",
              color: "#fff",
              whiteSpace: "nowrap",
            }}
          >
            <span className="font-medium">{hovered.label}</span>
            <span className="opacity-80"> · {hovered.value}</span>
            {hovered.trend !== undefined && (
              <span
                style={{
                  color: hovered.trend >= 0 ? "#4ade80" : "#f87171",
                  marginLeft: 6,
                }}
              >
                {hovered.trend >= 0 ? "+" : ""}
                {hovered.trend}%
              </span>
            )}
          </div>
        )}

        <svg width={240} height={200} viewBox="0 0 160 160" className="relative">
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              opacity={hovered && hovered !== t.segment ? 0.35 : 1}
              style={{
                transition: "opacity 120ms ease",
                cursor: "default",
              }}
              onMouseEnter={() => setHovered(t.segment)}
              onMouseLeave={() => setHovered(null)}
              pointerEvents="stroke"
            />
          ))}
          {/* Wider hit targets without changing visual stroke */}
          {ticks.map((t, i) => (
            <line
              key={`hit-${i}`}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="transparent"
              strokeWidth={12}
              strokeLinecap="round"
              onMouseEnter={() => setHovered(t.segment)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>

        <div className="absolute flex flex-col items-center pointer-events-none">
          <p
            className="text-[10px] uppercase tracking-[0.14em] font-medium"
            style={{ color: "#6b7280" }}
          >
            {totalLabel}
          </p>
          <p className="text-2xl font-bold leading-none mt-0.5" style={{ color: "#17191c" }}>
            {typeof totalValue === "number"
              ? totalValue.toLocaleString()
              : totalValue}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-1">
        {segments.map((s, i) => (
          <div
            key={i}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(null)}
            className="flex items-center justify-between text-xs lg:text-[13px] py-1.5 px-2 rounded-lg cursor-default"
            style={{
              background:
                hovered === s ? "rgba(255,255,255,0.7)" : "transparent",
              transition: "background 120ms ease",
            }}
          >
            <span className="flex items-center gap-2" style={{ color: "#4c4c4c" }}>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white"
                style={{ backgroundColor: colorFor(s, i) }}
              />
              {s.label}
            </span>
            <span className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: "#17191c" }}>
                {s.value.toLocaleString()}
              </span>
              {s.trend !== undefined && (
                <span style={{ color: s.trend >= 0 ? "#16a34a" : "#dc2626" }}>
                  {s.trend >= 0 ? "+" : ""}
                  {s.trend}%
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}