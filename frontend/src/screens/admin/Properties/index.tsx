import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Title from "@/components/dashboard/common/Title";
import StatsOverview from "@/components/dashboard/common/StatsOverview";
import { ChartSelect } from "@/components/common/charts/Chartselect";
import { useAdminProperties } from "./hooks/useProperties";
import AdminPropertyDrawer from "./AdminPropertyDrawer";
import type { Property, PropertyStatus } from "@/types/api";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Draft", value: "draft" },
  { label: "Paused", value: "paused" },
  { label: "Archived", value: "archived" },
];

const HEADERS = ["Name", "Seller", "Type", "Location", "Status", "Created"];

export default function AdminProperties() {
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | "">("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const { properties, isLoading, stats, isStatsLoading, page, setPage, totalPages, isFetching } =
    useAdminProperties();

  const filtered = properties.filter((p) => !statusFilter || p.status === statusFilter);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full p-4 py-8 lg:p-12 flex flex-col gap-8"
      >
        <Title
          title="Properties"
          description="Every listing across every seller on the platform."
        />

        <StatsOverview
          isLoading={isStatsLoading}
          growthPct={undefined}
          cards={[
            { label: "Active",   value: String(stats?.active ?? 0),   color: "#166534", bg: "#dcfce7" },
            { label: "Draft",    value: String(stats?.draft ?? 0),    color: "#92400e", bg: "#fef3c7" },
            { label: "Paused",   value: String(stats?.paused ?? 0),   color: "#374151", bg: "#f3f4f6" },
            { label: "Archived", value: String(stats?.archived ?? 0), color: "#991b1b", bg: "#fee2e2" },
          ]}
        />

        <div className="w-full flex lg:items-center justify-between lg:flex-row flex-col gap-3">
          <div className="flex items-center gap-3">
            <ChartSelect
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as PropertyStatus | "")}
              options={STATUS_OPTIONS}
            />
            <span className="text-xs lg:text-[13px]     text-[#a3a6af]">
              {filtered.length} propert{filtered.length === 1 ? "y" : "ies"}
            </span>
          </div>
        </div>

        <div className="border border-[#e8e6e3] rounded-xl overflow-hidden">
        <table className="w-full text-xs lg:text-[13px]   ">
            <thead>
              <tr className="border-b border-[#e8e6e3]">
                {HEADERS.map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs lg:text-xs text-[#a3a6af] uppercase whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f2f0ed]">
                    {HEADERS.map((h) => (
                      <td key={h} className="px-5 py-4">
                        <div className="h-4 rounded animate-pulse bg-[#f2f0ed] w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-xs lg:text-[13px]     text-[#a3a6af]">
                    No properties found.
                  </td>
                </tr>
              ) : (
                filtered.map((property) => (
                  <tr
                    key={property.id}
                    onClick={() => setSelectedProperty(property)}
                    className="border-b border-[#f2f0ed] last:border-0 hover:bg-[#fafaf9] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 bold" style={{ color: "#17191c" }}>{property.name}</td>
                    <td className="px-5 py-3" style={{ color: "#777b86" }}>{property.tenantName}</td>
                    <td className="px-5 py-3 capitalize" style={{ color: "#4c4c4c" }}>{property.property_type}</td>
                    <td className="px-5 py-3" style={{ color: "#777b86" }}>{property.address?.city}, {property.address?.state}</td>
                    <td className="px-5 py-3 capitalize">{property.status}</td>
                    <td className="px-5 py-3" style={{ color: "#a3a6af" }}>
                      {new Date(property.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="text-xs disabled:opacity-40">Previous</button>
          <span className="text-xs" style={{ color: "var(--color-muted-stone)" }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || isFetching} className="text-xs disabled:opacity-40">Next</button>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedProperty && (
          <AdminPropertyDrawer
            property={selectedProperty as never}
            onClose={() => setSelectedProperty(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}