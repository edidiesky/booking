import { motion } from "framer-motion";
import { X } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { RoomType } from "@/types/api";

interface Props {
  propertyName: string;
  roomTypes: RoomType[];
  onClose: () => void;
}

export default function RoomTypesDrawer({
  propertyName,
  roomTypes,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-end p-4 z-50">
      <motion.div
        initial={{ x: 480 }}
        animate={{ x: 0 }}
        exit={{ x: 480 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white w-full rounded-2xl overflow-hidden relative flex flex-col lg:w-[780px] h-full"
      >
        <div className="border-b border-[#e8e6e3] flex items-center justify-between px-6 h-[72px] shrink-0">
          <div>
            <h4 className="text-lg bold text-[#17191c]">Room Types</h4>
            <p className="text-sm text-[#777b86] mt-0.5">{propertyName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#f2f0ed] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {roomTypes.length === 0 ? (
            <p className="text-sm text-[#a3a6af] text-center py-10">
              No room types yet.
            </p>
          ) : (
            <>
              <div className="w-full grid grid-cols-3 gap-4">
                {roomTypes.map((rt) => (
                  <div
                    key={rt.id}
                    className="border border-[#e8e6e3] flex flex-col gap-3"
                  >
                    {rt.images?.[0] && (
                      <img
                        src={rt.images[0]}
                        alt={rt.name}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="w-full flex flex-col gap-3 p-4">
                      <div className="flex w-full items-start justify-between gap-2">
                        <p className="text-base bold text-[#17191c]">{rt.name}</p>
                        <span
                          className={`text-sm bold px-2 py-0.5 ${rt.status === "active" ? "bg-green-50 text-green-700" : "bg-[#f2f0ed] text-[#4c4c4c]"}`}
                        >
                          {rt.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 w-full gap-2 text-sm text-[#777b86]">
                        <span>Max {rt.maxOccupancy} guests</span>
                        <span>
                          {rt.quantity} unit{rt.quantity !== 1 ? "s" : ""}
                        </span>
                        <span className="text-[#17191c]">
                          {formatCurrency(rt.base_price_ngn)}/night
                        </span>
                      </div>
                      {rt.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {rt.amenities.map((a) => (
                            <span
                              key={a}
                              className="text-xs bold px-2 py-0.5 bg-[#f2f0ed] text-[#4c4c4c]"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
