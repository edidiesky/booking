import { motion } from "framer-motion";
import { ShieldOff } from "lucide-react";
import Title from "@/components/dashboard/common/Title";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/utils/formatDate";
import { useAdminAdministrators } from "./hooks/useAdminAdministrators";

export default function AdminAdministrators() {
  const {
    administrators, isLoading, isFetching,
    page, setPage, totalPages,
    search, setSearch,
    handleDemote, isDemoting,
    totalCount,
  } = useAdminAdministrators();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-4 py-8 lg:p-12 flex flex-col gap-8"
    >
      <Title
        title="Administrators"
        description="Platform administrator accounts with full or scoped access."
      />

      <div className="border border-[#e8e6e3] rounded-xl p-5 flex flex-col gap-5 w-fit min-w-[220px]">
        <p className="text-xs lg:text-[13px]  uppercase text-[#a3a6af]">Total</p>
        <p className="text-xl lg:text-4xl bold text-[#17191c]">{totalCount}</p>
        <p className="text-xs lg:text-[13px]  medium text-[#a3a6af]">Active platform administrator accounts</p>
      </div>

      <Input
        type="text"
        placeholder="Search administrators by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xs h-9 px-3 text-xs lg:text-[13px]  border border-[#e8e6e3] rounded-lg outline-none"
      />

      <div className="border border-[#e8e6e3] rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-left" style={{ borderColor: "#e8e6e3", color: "var(--color-hint-of-grey)" }}>
              <th className="px-5 py-3 font-normal">Name</th>
              <th className="px-5 py-3 font-normal">Email</th>
              <th className="px-5 py-3 font-normal">Since</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b" style={{ borderColor: "#f2f0ed" }}>
                  <td colSpan={4} className="px-5 py-4">
                    <div className="h-4 rounded animate-pulse bg-[#f2f0ed] w-3/4" />
                  </td>
                </tr>
              ))
            ) : administrators.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center" style={{ color: "var(--color-muted-stone)" }}>
                  No administrators found{search ? ` for "${search}"` : ""}.
                </td>
              </tr>
            ) : (
              administrators.map((a) => (
                <tr key={a.id} className="border-b hover:bg-[#fafaf9] transition-colors" style={{ borderColor: "#f2f0ed" }}>
                  <td className="px-5 py-3 bold" style={{ color: "#17191c" }}>{a.firstName} {a.lastName}</td>
                  <td className="px-5 py-3" style={{ color: "var(--color-muted-stone)" }}>{a.email}</td>
                  <td className="px-5 py-3" style={{ color: "var(--color-hint-of-grey)" }}>{formatDate(a.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDemote(a.id, `${a.firstName} ${a.lastName}`)}
                      disabled={isDemoting}
                      className="flex items-center gap-1 text-xs ml-auto disabled:opacity-50"
                      style={{ color: "#dc2626" }}
                    >
                      <ShieldOff size={13} /> Revoke
                    </button>
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
  );
}