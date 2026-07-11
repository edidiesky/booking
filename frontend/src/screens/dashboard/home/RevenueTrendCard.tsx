import { useState } from "react";
import { BarChartStacked, type DataKey } from "@/components/common/charts/BarChartStacked";

// TODO: replace with real data from useDashboardHome once a revenue-trend
// endpoint exists (e.g. GET /dashboard/revenue-trend?range=7-days)
const MOCK_TREND_DATA = [
  { date: "2026-07-04", base: 30000, middle: 8000, top: 4000 },
  { date: "2026-07-05", base: 40000, middle: 12000, top: 6000 },
  { date: "2026-07-06", base: 20000, middle: 7000, top: 4000 },
  { date: "2026-07-07", base: 45000, middle: 15000, top: 7000 },
  { date: "2026-07-08", base: 34000, middle: 11000, top: 7000 },
  { date: "2026-07-09", base: 50000, middle: 16000, top: 8000 },
  { date: "2026-07-10", base: 41000, middle: 13000, top: 7000 },
];

const dataKeys: DataKey[] = [
  { datakey: "base",   color: "#17191c" }, // bottom, darkest
  { datakey: "middle", color: "#4c4c4c" }, 
  { datakey: "top",    color: "#d8d8d8" }, 
];

const chartConfig = {
  base:   { label: "Base rate", color: "#17191c" },
  middle: { label: "Add-ons",   color: "#4c4c4c" },
  top:    { label: "Fees",      color: "#d8d8d8" },
};

export default function RevenueTrendCard() {
  const [selectedFilter, setSelectedFilter] = useState("7-days");

  return (
    <BarChartStacked
      title="Revenue Trend"
      description="Track how your booking revenue moves over time"
      data={MOCK_TREND_DATA}
      chartConfig={chartConfig}
      dataKeys={dataKeys}
      onFilterChange={setSelectedFilter}
      selectedFilter={selectedFilter}
      isCurrency
    />
  );
}