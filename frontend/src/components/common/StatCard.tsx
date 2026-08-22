import { ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";

export interface StatCardTrendPoint {
  value: number;
}

interface Props {
  label:       string;
  value:       string;
  trend?:      { value: number; positive?: boolean; label?: string };
  data?:       StatCardTrendPoint[];
  chartType?:  "sparkline" | "bars";
  color?:      string;
}


export default function StatCard({ label, value, trend, data, chartType = "sparkline", color = "#17191c" }: Props) {
  return (
    <div className="flex-1 min-w-[220px] border rounded-xl p-4 flex items-center justify-between gap-4" style={{ borderColor: "#e8e6e3" }}>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: "#777b86" }}>{label}</p>
        <p className="text-xl bold mt-1 truncate" style={{ color: "#17191c" }}>{value}</p>
        {trend && (
          <p className="text-xs lg:text-[13px]   mt-1">
            <span className="bold" style={{ color: trend.positive !== false ? "#16a34a" : "#dc2626" }}>
              {trend.positive !== false ? "+" : ""}{trend.value}%
            </span>{" "}
            <span style={{ color: "#a3a6af" }}>{trend.label ?? "vs last month"}</span>
          </p>
        )}
      </div>

      {data && data.length > 0 && (
        <div className="w-24 h-12 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bars" ? (
              <BarChart data={data}>
                <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`stat-grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#stat-grad-${label})`} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}