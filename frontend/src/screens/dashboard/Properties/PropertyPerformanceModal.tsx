import { motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useState } from "react";
import { ChartLineMultiple } from "@/components/common/charts/LineChart";
import {
  BarChartStacked,
  type DataKey,
} from "@/components/common/charts/BarChartStacked";

interface Props {
  property: {
    id: string;
    name: string;
    images?: string[];
    createdAt: string;
    updatedAt: string;
  };
  onClose: () => void;
  isOpen: boolean;
}

const PLACEHOLDER_SALES_TREND = [
  { date: "2026-08-01", sales: 0 },
  { date: "2026-08-08", sales: 0 },
  { date: "2026-08-15", sales: 0 },
];
const PLACEHOLDER_REVENUE_TREND = [
  { date: "2026-08-01", revenue: 0 },
  { date: "2026-08-08", revenue: 0 },
  { date: "2026-08-15", revenue: 0 },
];
const PLACEHOLDER_ORDER_VALUE = [
  { date: "2026-08-01", orderValue: 0 },
  { date: "2026-08-08", orderValue: 0 },
];
const PLACEHOLDER_COMPARISON = [{ name: "This property", value: 0 }];

const orderValueKeys: DataKey[] = [
  { datakey: "orderValue", color: "var(--color-primary)" },
];
const orderValueConfig = {
  orderValue: { label: "Average order value", color: "var(--color-primary)" },
};

export default function PropertyPerformanceModal({
  property,
  onClose,
  isOpen,
}: Props) {
  const [salesFilter, setSalesFilter] = useState("7-days");
  const [revenueFilter, setRevenueFilter] = useState("7-days");
  const [orderFilter, setOrderFilter] = useState("7-days");

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-end p-4 z-50">
      <motion.div
        initial={{ x: 800 }}
        animate={isOpen ? { x: 0 } : { x: 800 }}
        exit={{ x: 800 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white w-full rounded-2xl overflow-hidden relative flex flex-col lg:w-[750px] h-full"
      >
        <div className="sticky top-0 bg-white flex items-start justify-between gap-4 px-6 py-5 border-b border-[#e8e6e3] z-10">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={property.images?.[0] ?? "/hero.jpg"}
              alt=""
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[#17191c] truncate">
                {property.name}
              </h3>
              <p className="text-xs lg:text-[13px]    text-[#a3a6af]">
                ID {property.id.slice(0, 8)} · Created{" "}
                {new Date(property.createdAt).toLocaleDateString()} · Updated{" "}
                {new Date(property.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f2f0ed] transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="w-full overflow-auto">
          {/* Real, honest banner in place of the reference's AI
            recommendation, since no ad/reach feature exists on this
            platform, this is a data-completeness notice instead of
            fabricating a feature that isn't real. */}
          <div className="mx-6 mt-4 flex items-start gap-3 bg-[#fdf6e3] border border-[#f3e5b0] rounded-xl px-4 py-3">
            <Sparkles size={16} className="text-[#92400e] shrink-0 mt-0.5" />
            <p className="text-xs lg:text-[13px]    text-[#92400e]">
              Placeholder data. Real per-property analytics require a backend
              endpoint that doesn't exist yet, everything shown below is a
              stand-in, not a live number.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-5">
            <ChartLineMultiple
              title="Total sales"
              description="Bookings made for this property"
              data={PLACEHOLDER_SALES_TREND}
              chartConfig={{
                sales: { label: "Sales", color: "var(--color-primary)" },
              }}
              series={[
                {
                  datakey: "sales",
                  color: "var(--color-primary)",
                  label: "Sales",
                },
              ]}
              onFilterChange={setSalesFilter}
              selectedFilter={salesFilter}
              emptyMessage="No sales data yet"
            />

            <ChartLineMultiple
              title="Total revenue"
              description="Confirmed booking revenue for this property"
              data={PLACEHOLDER_REVENUE_TREND}
              chartConfig={{ revenue: { label: "Revenue", color: "#4c4c4c" } }}
              series={[
                { datakey: "revenue", color: "#4c4c4c", label: "Revenue" },
              ]}
              onFilterChange={setRevenueFilter}
              selectedFilter={revenueFilter}
              isCurrency
              emptyMessage="No revenue data yet"
            />

            <div className="border border-[#e8e6e3] rounded-2xl p-5">
              <p className="text-xs lg:text-[13px]    text-[#17191c] mb-4">
                Sale comparison
              </p>
              <div className="flex flex-col gap-3">
                {PLACEHOLDER_COMPARISON.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between text-xs lg:text-[13px]   "
                  >
                    <span className="text-[#4c4c4c]">{row.name}</span>
                    <span className="font-semibold text-[#17191c]">
                      {row.value.toLocaleString()} sales
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <BarChartStacked
              title="Average order value"
              description="Average booking value over time"
              data={PLACEHOLDER_ORDER_VALUE}
              chartConfig={orderValueConfig}
              dataKeys={orderValueKeys}
              onFilterChange={setOrderFilter}
              selectedFilter={orderFilter}
              isCurrency
              emptyMessage="No order data yet"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
