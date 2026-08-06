import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { usePropertyDetail } from "./hooks/usePropertyDetail";
import { formatCurrency } from "@/utils/formatCurrency";
import { useState } from "react";
import RoomTypeDetailModal from "./RoomTypeDetailModal";

const STATUS_CFG: Record<string, { label: string; className: string }> = {
  occupied: { label: "Occupied", className: "text-green-700" },
  vacant: { label: "Vacant", className: "text-[#a3a6af]" },
  maintenance: { label: "Maintenance", className: "text-orange-600" },
};

export default function PropertyDetail() {
  const navigate = useNavigate();
  const {property, roomTypes, summary, isLoading } =
    usePropertyDetail();
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(
    null,
  );

  if (isLoading || !property) {
    return (
      <div className="w-full p-6 lg:p-10 flex flex-col gap-6">
        <div className="h-8 w-64 rounded animate-pulse bg-[#f2f0ed]" />
        <div className="h-96 rounded-xl animate-pulse bg-[#f2f0ed]" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full p-6 lg:p-10 flex flex-col gap-6"
      >
        <div className="flex items-center gap-1.5 text-xs lg:text-sm lg:text-smtext-[#a3a6af]">
          <button
            onClick={() => navigate("/dashboard/properties")}
            className="hover:text-[#17191c] transition-colors"
          >
            Properties
          </button>
          <ChevronRight size={13} />
          <span className="text-[#17191c] bold">{property.name}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h4 className="text-xl bold text-[#17191c]">{property.name}</h4>
            <p className="flex items-center gap-1.5 text-xs lg:text-sm lg:text-sm text-[#777b86] mt-1">
              {property.address.street}, {property.address.city},{" "}
              {property.address.state}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Units / room types table */}
          <div className="w-full flex flex-col gap-7">
            <div className="flex items-center justify-between">
              <p className="text-xs lg:text-sm lg:text-sm text-[#17191c]">Units</p>
              <button
                onClick={() => {
                  /* opens CreateRoomTypeModal, wire existing modal here */
                }}
                className="text-xs lg:text-sm lg:text-smpx-4 py-2 bg-[#17191c] text-white rounded-full hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                Add
              </button>
            </div>

            <table className="w-full text-xs lg:text-sm lg:text-smborder rounded-2xl">
              <thead>
                <tr className="border-b border-[#f2f0ed]">
                  {["Unit", "Layout", "Status", "Rent", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs lg:text-sm lg:text-smtext-[#a3a6af] uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roomTypes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-xs lg:text-sm lg:text-smtext-[#a3a6af]"
                    >
                      No room types yet.
                    </td>
                  </tr>
                ) : (
                  roomTypes.map((rt) => {
                    const cfg = STATUS_CFG[rt.occupancy_status];
                    return (
                      <tr
                        key={rt.id}
                        onClick={() => setSelectedRoomTypeId(rt.id)}
                        className="border-b border-[#f2f0ed] last:border-0 hover:bg-[#fafaf9] transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3">
                          <p className="bold text-[#17191c]">{rt.name}</p>
                          <p className="text-xs lg:text-sm lg:text-smtext-[#a3a6af]">
                            {rt.status ?? "—"}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-[#4c4c4c]">
                          Max {rt.maxOccupancy} guests
                        </td>
                        <td className={`px-5 py-3 bold ${cfg.className}`}>
                          {cfg.label}
                        </td>
                        <td className="px-5 py-3 text-[#17191c] bold whitespace-nowrap">
                          {formatCurrency(Number(rt.base_price_ngn))}/mo
                        </td>
                        <td className="px-5 py-3 text-[#a3a6af]">
                          <ChevronRight size={14} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Details + occupancy sidebar, matches image 2 exactly */}
          <div className="flex flex-col gap-4">
            <div className="border border-[#e8e6e3] rounded-xl p-5 flex flex-col gap-3">
              <p className="text-xs lg:text-sm lg:text-smuppercase text-[#a3a6af] bold">
                Details
              </p>
              {[
                ["Type", property.property_type],
                [
                  "Address",
                  `${property.address.street}, ${property.address.city}`,
                ],
                ["Revenue", `${formatCurrency(summary?.revenue ?? 0)} / mo`],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs lg:text-sm lg:text-smtext-[#a3a6af]">{label}</span>
                  <span className="text-xs lg:text-sm lg:text-smtext-[#17191c] bold">{value}</span>
                </div>
              ))}
            </div>

            <div className="border border-[#e8e6e3] rounded-xl p-5 flex flex-col gap-3">
              <p className="text-xs lg:text-sm lg:text-smuppercase text-[#a3a6af] bold">
                Occupancy
              </p>
              {[
                ["Occupied", summary?.occupied ?? 0],
                ["Vacant", summary?.vacant ?? 0],
                ["Maintenance", summary?.maintenance ?? 0],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-xs lg:text-sm"
                >
                  <span className="text-[#777b86]">{label}</span>
                  <span className="text-[#17191c] bold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {selectedRoomTypeId && (
          <RoomTypeDetailModal
            roomTypeId={selectedRoomTypeId}
            onClose={() => setSelectedRoomTypeId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
