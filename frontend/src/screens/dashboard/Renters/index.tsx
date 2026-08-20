import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {  Eye } from "lucide-react";
import RowActionsMenu from "@/components/common/RowActionsMenu";
import RenterDetailsModal from "./RenterDetailsModal";
import { useRenters } from "./hooks/useRenters";
import { formatDate } from "@/utils/formatDate";
import { Input } from "@/components/ui/input";

export default function DashboardRenters() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { renters, stats, isLoading, search, setSearch } = useRenters();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full p-6 lg:p-10 flex flex-col gap-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-xl bold text-[#17191c]">Tenants</h4>
            <p className="text-xs lg:text-[13px]text-[#64645f] mt-1">
              Manage tenant records across your properties.
            </p>
          </div>
          <button className="bg-[#17191c] flex bold rounded-full items-center gap-2 hover:opacity-90 text-white text-xs lg:text-[13px]  p-2 px-4">
            Add Tenant
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            ["Total", stats?.total ?? 0, "Tenant records"],
            [
              "With Phone",
              stats?.withPhone ?? 0,
              "Have a phone number on file",
            ],
            [
              "Emergency Contact",
              stats?.withEmergency ?? 0,
              "Have emergency contact",
            ],
          ].map(([label, value, sub]) => (
            <div
              key={label as string}
              className="border border-[#e8e6e3] rounded-xl p-5 flex flex-col gap-5"
            >
              <p className="text-xs lg:text-[13px]  uppercase text-[#a3a6af]">{label}</p>
              <p className="text-xl lg:text-4xl bold text-[#17191c]">{value}</p>
              <p className="text-xs lg:text-[13px]  medium text-[#a3a6af]">{sub}</p>
            </div>
          ))}
        </div>

        <Input
          type="text"
          placeholder="Search tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs h-9 px-3 text-xs lg:text-[13px]  border border-[#e8e6e3] rounded-lg outline-none"
        />

        <div className="border border-[#e8e6e3] rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e8e6e3]">
                {["Tenant", "Contact", "Emergency", "Added", ""].map((h) => (
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
              ) : renters.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-xs lg:text-[13px]  text-[#a3a6af]"
                  >
                    No tenants found.
                  </td>
                </tr>
              ) : (
                renters.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className="border-b border-[#f2f0ed] last:border-0 hover:bg-[#fafaf9] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <p className="bold text-[#17191c]">
                        {r.full_name}
                      </p>
                      <p className="text-xs lg:text-[13px]  text-[#777b86]">{r.email}</p>
                    </td>
                    <td className="px-5 py-3 text-[#4c4c4c]">
                      {r.phone ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-[#4c4c4c]">
                      {r.emergency_contact_name ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-[#777b86]">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <RowActionsMenu
                        actions={[
                          {
                            label: "View details",
                            icon: Eye,
                            onClick: () => setSelectedId(r.id),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedId && (
          <RenterDetailsModal
            renterId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
