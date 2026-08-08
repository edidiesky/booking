import { AnimatePresence, motion } from "framer-motion";
import Title from "@/components/dashboard/common/Title";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/utils/formatDate";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";
import { useAdminCustomers } from "./hooks/useAdminCustomers";
import CustomerDrawer from "./CustomerDrawer";

export default function AdminCustomers() {
  const {
    guests,
    isLoading,
    isFetching,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    selectedGuest,
    setSelectedGuest,
    stats,
  } = useAdminCustomers();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full p-4 py-8 lg:p-12 flex flex-col gap-8"
      >
        <Title
          title="Customers / Guests"
          description="Every guest account registered on the platform."
        />

        <div className="grid grid-cols-3 gap-4">
          {[
            ["Total", stats?.total ?? 0, "Registered guest accounts"],
            [
              "Email verified",
              stats?.verified ?? 0,
              "Confirmed their email address",
            ],
            [
              "Via Google",
              stats?.viaGoogle ?? 0,
              "Signed up with Google OAuth",
            ],
          ].map(([label, value, sub]) => (
            <div
              key={label as string}
              className="border border-[#e8e6e3] rounded-xl p-5 flex flex-col gap-5"
            >
              <p className="text-xs lg:text-sm uppercase text-[#a3a6af]">
                {label}
              </p>
              <p className="text-xl lg:text-4xl bold text-[#17191c]">{value}</p>
              <p className="text-xs lg:text-sm medium text-[#a3a6af]">{sub}</p>
            </div>
          ))}
        </div>

        <Input
          type="text"
          placeholder="Search guests by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs h-9 px-3 text-xs lg:text-sm border border-[#e8e6e3] rounded-lg outline-none"
        />

        <div className="border border-[#e8e6e3] rounded-xl overflow-hidden">
          <table className="w-full text-xs lg:text-[13px]">
            <thead>
              <tr className="border-b border-[#e8e6e3]">
                {["Name", "Email", "Status", "Joined"].map((h) => (
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
                    <td colSpan={4} className="px-5 py-4">
                      <div className="h-4 rounded animate-pulse bg-[#f2f0ed] w-3/4" />
                    </td>
                  </tr>
                ))
              ) : guests.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-xs lg:text-sm text-[#a3a6af]"
                  >
                    No guests found{search ? ` for "${search}"` : ""}.
                  </td>
                </tr>
              ) : (
                guests.map((g) => (
                  <tr
                    key={g.id}
                    onClick={() => setSelectedGuest(g)}
                    className="border-b border-[#f2f0ed] last:border-0 hover:bg-[#fafaf9] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 bold" style={{ color: "#17191c" }}>
                      {g.firstName} {g.lastName}
                    </td>
                    <td className="px-5 py-3" style={{ color: "#777b86" }}>
                      {g.email}
                    </td>
                    <td className="px-5 py-3 capitalize">{g.status}</td>
                    <td className="px-5 py-3" style={{ color: "#a3a6af" }}>
                      {formatDate(g.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage(page - 1);
                  }}
                  className={page === 1 ? "pointer-events-none opacity-40" : ""}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(p);
                    }}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage(page + 1);
                  }}
                  className={
                    page === totalPages || isFetching
                      ? "pointer-events-none opacity-40"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedGuest && (
          <CustomerDrawer
            guest={selectedGuest}
            onClose={() => setSelectedGuest(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
