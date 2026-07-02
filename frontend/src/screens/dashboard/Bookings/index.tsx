import { useState }          from "react";
import { motion }            from "framer-motion";
import { AnimatePresence }   from "framer-motion";
import BookingDrawer         from "./BookingDrawer";
import { useTenantBookings } from "./hooks/useTenantBookings";
import { ChartSelect }       from "@/components/common/charts/Chartselect";
import type { Booking, BookingStatus } from "@/types/api";
import { ChevronRight }      from "lucide-react";

const STATUS_CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending_payment: { label: "Pending Payment", className: "bg-yellow-50 text-yellow-800" },
  confirmed:       { label: "Confirmed",       className: "bg-blue-50 text-blue-700"    },
  checked_in:      { label: "Checked In",      className: "bg-green-50 text-green-700"  },
  checked_out:     { label: "Checked Out",     className: "bg-[#f2f0ed] text-[#4c4c4c]"},
  cancelled:       { label: "Cancelled",       className: "bg-red-50 text-red-700"      },
  refunded:        { label: "Refunded",        className: "bg-purple-50 text-purple-700" },
};

const STATUS_OPTIONS: { label: string; value: BookingStatus | "" }[] = [
  { label: "All statuses",    value: ""                },
  { label: "Pending Payment", value: "pending_payment" },
  { label: "Confirmed",       value: "confirmed"       },
  { label: "Checked In",      value: "checked_in"      },
  { label: "Checked Out",     value: "checked_out"     },
  { label: "Cancelled",       value: "cancelled"       },
];

const HEADERS = ["Reference", "Property", "Dates", "Rooms", "Amount", "Status", ""];

export default function DashboardBookings() {
  const [selected, setSelected] = useState<Booking | null>(null);

  const {
    bookings, isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
  } = useTenantBookings();

  return (
    <>
      <AnimatePresence>
        {selected && (
          <BookingDrawer booking={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full p-4 py-8 lg:p-12 flex flex-col gap-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-xl lg:text-2xl font-semibold text-[#17191c]">Bookings</h4>
            <p className="text-sm text-[#64645f] mt-1 max-w-[420px]">
              Manage guest reservations. Click a row to view details and take actions.
            </p>
          </div>
          <span className="text-sm text-[#a3a6af] mt-2">{bookings.length} total</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
              placeholder="Search by booking reference..."
              className="w-full max-w-xs h-[38px] px-4 border border-[#e8e6e3] text-sm outline-none focus:border-[#17191c] transition-colors"
            />
          </div>
          <ChartSelect
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as BookingStatus | "")}
            options={STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          />
        </div>

        <div className="border border-[#e8e6e3] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8e6e3]">
                {HEADERS.map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-[#a3a6af] uppercase whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f2f0ed]">
                    {HEADERS.map((h) => (
                      <td key={h} className="px-5 py-4">
                        <div className="h-4 rounded animate-pulse bg-[#f2f0ed] w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-[#a3a6af]">
                    No bookings found{search ? ` for "${search}"` : ""}
                  </td>
                </tr>
              ) : bookings.map((b) => {
                const cfg = STATUS_CONFIG[b.status];
                return (
                  <tr
                    key={b.bookingId}
                    onClick={() => setSelected(b)}
                    className="border-b border-[#f2f0ed] last:border-0 hover:bg-[#fafaf9] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 text-[#17191c] font-semibold whitespace-nowrap">
                      {b.bookingRef}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#777b86] whitespace-nowrap max-w-[140px] truncate">
                      {b.propertyId}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#777b86] whitespace-nowrap">
                      {b.checkIn} - {b.checkOut}
                    </td>
                    <td className="px-5 py-3 text-[#4c4c4c]">{b.roomsCount}</td>
                    <td className="px-5 py-3 text-[#17191c] font-semibold whitespace-nowrap">
                      ₦{b.totalAmountNgn.toLocaleString("en-NG")}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 ${cfg.className}`}>{cfg.label}</span>
                    </td>
                    <td className="px-5 py-3 text-[#777b86]">
                      <ChevronRight size={14} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </>
  );
}