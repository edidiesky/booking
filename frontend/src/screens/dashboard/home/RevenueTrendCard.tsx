import { useState } from "react";
import { BarChartStacked, type DataKey } from "@/components/common/charts/BarChartStacked";
import { useGetRevenueTrendQuery } from "@/redux/services/bookingApi";

const dataKeys: DataKey[] = [
  { datakey: "hostPayout",  color: "var(--color-primary)" },
  { datakey: "platformFee", color: "#4c4c4c" },
];

const chartConfig = {
  hostPayout:  { label: "Host payout",  color: "var(--color-primary)" },
  platformFee: { label: "Platform fee", color: "#4c4c4c" },
};

export default function RevenueTrendCard() {
  const [selectedFilter, setSelectedFilter] = useState("7-days");
  const { data, isLoading } = useGetRevenueTrendQuery({ range: selectedFilter });

  const trendData = (data?.data ?? []).map((row) => ({
    date: row.day,
    hostPayout: row.hostPayout,
    platformFee: row.platformFee,
  }));

  return (
    <BarChartStacked
      title="Revenue Trend"
      description="Track how your booking revenue moves over time"
      data={trendData}
      chartConfig={chartConfig}
      dataKeys={dataKeys}
      onFilterChange={setSelectedFilter}
      selectedFilter={selectedFilter}
      isCurrency
      emptyMessage={isLoading ? "Loading revenue trend..." : "No revenue recorded for this period yet."}
    />
  );
}