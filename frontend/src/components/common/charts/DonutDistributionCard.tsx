import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export interface DistributionSegment {
  label: string;
  value: number;
  color: string;
  trend?: number;
}

interface Props {
  title:        string;
  totalLabel?:  string;
  totalValue:   string;
  segments:     DistributionSegment[];
  icon?:        React.ReactNode;
}

// Matches Customer Segmentation / Total Assets / Sales Distribution:
// a donut chart with a centered total, a legend list below with each
// segment's own value and optional trend. Fully generic over segments,
// works for booking status counts, revenue-by-channel, occupancy by
// room type, anything that's "parts of a whole" with a real total.
export default function DonutDistributionCard({ title, totalLabel = "Total", totalValue, segments, icon }: Props) {
  const chartData = segments.map((s) => ({ name: s.label, value: s.value }));

  return (
    <div className="border rounded-xl p-4" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <p className="text-xs lg:text-[13px]   " style={{ color: "#17191c" }}>{title}</p>
      </div>

      <div className="relative h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="70%"
              outerRadius="95%"
              paddingAngle={2}
              stroke="none"
            >
              {segments.map((s, i) => (
                <Cell key={i} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: "#a3a6af" }}>{totalLabel}</p>
          <p className="text-lg bold" style={{ color: "#17191c" }}>{totalValue}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2" style={{ color: "#4c4c4c" }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
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