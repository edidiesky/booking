import { motion } from "framer-motion";
import { X, Mail, Phone, ShieldAlert } from "lucide-react";
import { useGetRenterDetailQuery } from "@/redux/services/renterApi";
import { formatDate } from "@/utils/formatDate";
import StatusBadge from "@/components/common/StatusBadge";
import type { BookingStatus } from "@/types/api";

interface Props {
  renterId: string;
  onClose:  () => void;
}

export default function RenterDetailsModal({ renterId, onClose }: Props) {
  const { data, isLoading } = useGetRenterDetailQuery(renterId);
  const renter    = data?.data.renter;
  const occupancy = data?.data.occupancy;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm p-4 flex items-center justify-end z-50">
      <motion.div
        initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white w-full rounded-2xl overflow-hidden relative flex flex-col lg:w-[480px] h-[95vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6e3]">
          {isLoading || !renter ? (
            <p className="text-xs lg:text-sm text-[#17191c]">Loading...</p>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#17191c] text-white flex items-center justify-center text-xs lg:text-sm">
                {renter.full_name.charAt(0).toUpperCase()}
              </div>
              <p className="text-xs lg:text-sm text-[#17191c]">{renter.full_name}</p>
            </div>
          )}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-[#f2f0ed] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading || !renter ? (
            <div className="flex flex-col gap-4">
              <div className="h-4 w-2/3 rounded animate-pulse bg-[#f2f0ed]" />
              <div className="h-24 rounded-xl animate-pulse bg-[#f2f0ed]" />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs lg:text-sm uppercase text-[#a3a6af]  mb-3">Contact</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#777b86] flex items-center gap-1.5"><Mail size={13} /> Email</span>
                    <span className="text-[#17191c] ">{renter.email ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#777b86] flex items-center gap-1.5"><Phone size={13} /> Phone</span>
                    <span className="text-[#17191c] ">{renter.phone ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#777b86] flex items-center gap-1.5"><ShieldAlert size={13} /> Emergency</span>
                    <span className="text-[#17191c]  text-right max-w-[60%]">
                      {renter.emergency_contact_name
                        ? `${renter.emergency_contact_name} · ${renter.emergency_contact_phone ?? "—"}`
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs lg:text-sm uppercase text-[#a3a6af]  mb-3">Current stay</p>
                {occupancy ? (
                  <div className="border border-[#e8e6e3] rounded-xl p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#777b86]">Property</span>
                      <span className="text-[#17191c] ">{occupancy.property_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#777b86]">Room type</span>
                      <span className="text-[#17191c] ">{occupancy.room_type_name}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#777b86]">Check-out</span>
                      <span className="text-[#17191c] ">{formatDate(occupancy.check_out)}</span>
                    </div>
                    <StatusBadge status={occupancy.status as BookingStatus} />
                  </div>
                ) : (
                  <p className="text-xs lg:text-sm text-[#a3a6af]">No active booking, not currently staying at any property.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}