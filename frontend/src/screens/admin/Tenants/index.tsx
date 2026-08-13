import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useAdminTenants } from "./hooks/useAdminTenants";
import TenantDetailModal from "./TenantDetailModal";
import type { Tenant } from "@/types/api";
import Title from "@/components/dashboard/common/Title";
import StatsOverview from "@/components/dashboard/common/StatsOverview";

const STATUS_CFG: Record<
  Tenant["status"],
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-[#f2f0ed] text-[#4c4c4c]" },
  active: { label: "Active", className: "bg-green-50 text-green-700" },
  suspended: { label: "Suspended", className: "bg-red-50 text-red-700" },
};

export default function AdminTenants() {
  const {
    tenants,
    isLoading,
    search,
    setSearch,
    page,
    setPage,
    handleToggleStatus,
    isTogglingStatus,
    stats,
  } = useAdminTenants();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full p-4 py-8 lg:p-12 flex flex-col gap-8"
      >
        <div className="flex items-start justify-between gap-4">
          <Title
            title="Sellers / Tenants"
            description="Every seller account on the platform, active, suspended, or in draft."
          />
        </div>
        <StatsOverview
          isLoading={isLoading}
          growthTooltip="Successful payment volume this calendar month vs. last calendar month"
          cards={[
            {
              label: "Active",
              sub: "Currently operating on the platform",
              value: String(stats?.active ?? 0),
              color: "#166534",
              bg: "#dcfce7",
            },
            {
              label: "Suspended",
              sub: "Access revoked, pending review",
              value: String(stats?.suspended ?? 0),
              color: "#5b21b6",
              bg: "#ede9fe",
            },
            {
              label: "Draft",
              sub: "Onboarding not yet completed",
              value: String(stats?.draft ?? 0),
              color: "#5b21b6",
              bg: "#ede9fe",
            },
          ]}
        />
        {/* <div className="grid grid-cols-3 gap-4">
          {[
            [
              "Active",
              stats?.active ?? 0,
              "Currently operating on the platform",
            ],
            [
              "Suspended",
              stats?.suspended ?? 0,
              "Access revoked, pending review",
            ],
            ["Draft", stats?.draft ?? 0, "Onboarding not yet completed"],
          ].map(([label, value, sub]) => (
            <div
              key={label as string}
              className="border border-[#e8e6e3] rounded-xl p-5 flex flex-col gap-5"
            >
              <p className="text-xs lg:text-[13px] uppercase text-[#a3a6af]">
                {label}
              </p>
              <p className="text-xl lg:text-4xl bold text-[#17191c]">{value}</p>
              <p className="text-xs lg:text-[13px] medium text-[#a3a6af]">{sub}</p>
            </div>
          ))}
        </div> */}

        <Input
          type="text"
          placeholder="Search sellers by name or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs h-9 px-3 text-xs lg:text-[13px] border border-[#e8e6e3] rounded-lg outline-none"
        />

        <div className="border border-[#e8e6e3] rounded-xl overflow-hidden">
          <table className="w-full text-xs lg:text-[13px]">
            <thead>
              <tr className="border-b border-[#e8e6e3]">
                {["Name", "Slug", "Status", "Platform fee", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs lg:text-xs text-[#a3a6af] uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f2f0ed]">
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-4 rounded animate-pulse bg-[#f2f0ed] w-3/4" />
                    </td>
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-xs lg:text-[13px] text-[#a3a6af]"
                  >
                    No sellers found{search ? ` for "${search}"` : ""}.
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr
                    onClick={() => setSelectedTenantId(tenant.id)}
                    key={tenant.id}
                    className="border-b border-[#f2f0ed] last:border-0 hover:bg-[#fafaf9] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setSelectedTenantId(tenant.id)}
                        className="hover:underline bold"
                        style={{ color: "#17191c" }}
                      >
                        {tenant.name}
                      </button>
                    </td>
                    <td className="px-5 py-3" style={{ color: "#777b86" }}>
                      {tenant.slug}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full ${STATUS_CFG[tenant.status].className}`}
                      >
                        {STATUS_CFG[tenant.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-3" style={{ color: "#777b86" }}>
                      {tenant.platformFeePct}%
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(tenant)}
                        disabled={isTogglingStatus}
                        className="text-xs lg:text-[13px] underline disabled:opacity-40"
                        style={{
                          color:
                            tenant.status === "suspended"
                              ? "#00a86b"
                              : "#dc2626",
                        }}
                      >
                        {tenant.status === "suspended"
                          ? "Reactivate"
                          : "Suspend"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs lg:text-[13px] disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs" style={{ color: "#a3a6af" }}>
            Page {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="text-xs lg:text-[13px]"
          >
            Next
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedTenantId && (
          <TenantDetailModal
            tenantId={selectedTenantId}
            onClose={() => setSelectedTenantId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
