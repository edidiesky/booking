import { motion } from "framer-motion";
import { X, Users, BedDouble } from "lucide-react";
import { useGetRoomTypeDetailQuery } from "@/redux/services/propertyApi";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate }     from "@/utils/formatDate";
import LazyImage          from "@/components/common/LazyImage";
import StatusBadge        from "@/components/common/StatusBadge";
import type { BookingStatus } from "@/types/api";

const STATUS_CFG: Record<string, { label: string; className: string }> = {
  active:   { label: "Active",   className: "bg-green-50 text-green-700"   },
  inactive: { label: "Inactive", className: "bg-[#f2f0ed] text-[#4c4c4c]" },
};

interface Props {
  roomTypeId: string;
  onClose:    () => void;
}

export default function RoomTypeDetailModal({ roomTypeId, onClose }: Props) {
  const { data, isLoading } = useGetRoomTypeDetailQuery(roomTypeId);
  const roomType = data?.data.roomType;
  const occupant = data?.data.occupant;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm p-4 flex items-center justify-end z-50">
      <motion.div
        initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white w-full rounded-2xl overflow-hidden relative flex flex-col lg:w-[750px] h-[95vh]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6e3]">
          <p className="text-xs lg:text-sm text-[#17191c]">{roomType?.name ?? "Room type"}</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-[#f2f0ed] transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading || !roomType ? (
            <div className="flex flex-col gap-4">
              <div className="h-64 rounded-xl animate-pulse bg-[#f2f0ed]" />
              <div className="h-4 w-2/3 rounded animate-pulse bg-[#f2f0ed]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">

              <div className="flex flex-col gap-6">
                {(roomType?.images?.length ?? 0) > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {roomType.images!.map((src, i) => (
                      <div key={i} className={`overflow-hidden rounded-xl ${i === 0 ? "col-span-3 h-[240px]" : "h-[110px]"}`}>
                        <LazyImage src={src} alt={`${roomType.name} ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs lg:text-sm text-[#17191c]">{roomType.name}</p>
                    <span className={`text-xs lg:text-smpx-2 py-0.5 rounded-full bold ${(STATUS_CFG[roomType.status] ?? STATUS_CFG.inactive).className}`}>
                      {(STATUS_CFG[roomType.status] ?? STATUS_CFG.inactive).label}
                    </span>
                  </div>
                  <p className="text-xs lg:text-sm text-[#777b86] mt-2 leading-relaxed">{roomType.description ?? "No description provided."}</p>
                </div>

                {roomType.amenities?.length > 0 && (
                  <div>
                    <p className="text-xs lg:text-smuppercase text-[#a3a6af] bold mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {roomType.amenities.map((a) => (
                        <span key={a} className="text-xs lg:text-smpx-3 py-1 rounded-full bg-[#f2f0ed] text-[#4c4c4c]">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="border border-[#e8e6e3] rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-xs lg:text-smuppercase text-[#a3a6af] bold">Pricing & capacity</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#777b86] flex items-center gap-1.5"><BedDouble size={13} /> Rent</span>
                    <span className="text-[#17191c] bold">{formatCurrency(Number(roomType.base_price_ngn))}/mo</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#777b86] flex items-center gap-1.5"><Users size={13} /> Max occupancy</span>
                    <span className="text-[#17191c] bold">{roomType.maxOccupancy}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#777b86]">Quantity</span>
                    <span className="text-[#17191c] bold">{roomType.quantity}</span>
                  </div>
                </div>

                <div className="border border-[#e8e6e3] rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-xs lg:text-smuppercase text-[#a3a6af] bold">Current occupant</p>
                  {occupant ? (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#777b86]">Guest</span>
                        <span className="text-[#17191c] bold">{occupant.guest_name}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#777b86]">Check-out</span>
                        <span className="text-[#17191c] bold">{formatDate(occupant.check_out)}</span>
                      </div>
                      <StatusBadge status={occupant.status as BookingStatus} />
                    </>
                  ) : (
                    <p className="text-xs lg:text-sm text-[#a3a6af]">Vacant, no active booking.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}