import { useState } from "react";
import { BarChartStacked, type DataKey } from "@/components/common/charts/BarChartStacked";
import { useGetAdminRevenueTrendQuery } from "@/redux/services/adminApi";

const dataKeys: DataKey[] = [
  { datakey: "hostPayout",  color: "var(--color-primary)" },
  { datakey: "platformFee", color: "#4c4c4c" },
];

const chartConfig = {
  hostPayout:  { label: "Host payout",  color: "var(--color-primary)" },
  platformFee: { label: "Platform fee", color: "#4c4c4c" },
};

export default function AdminRevenueTrendCard() {
  const [selectedFilter, setSelectedFilter] = useState("7-days");
  const { data } = useGetAdminRevenueTrendQuery({ range: selectedFilter });

  const trendData = (data?.data ?? []).map((row) => ({
    date: row.day,
    hostPayout: row.hostPayout,
    platformFee: row.platformFee,
  }));

  return (
    <BarChartStacked
      title="Revenue Trend"
      description="Track platform-wide booking revenue over time, every seller combined"
      data={trendData}
      chartConfig={chartConfig}
      dataKeys={dataKeys}
      onFilterChange={setSelectedFilter}
      selectedFilter={selectedFilter}
      isCurrency
      emptyMessage="No revenue recorded for this period yet."
    />
  );
}