import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import PropertyTableRow from "./PropertyTableRow";
import PropertyModal from "./PropertyModal";
import CreateRoomTypeModal from "./CreateRoomTypeModal";
import { useProperties } from "./hooks/useProperties";
import { ChartSelect } from "@/components/common/charts/Chartselect";
import type { Property, PropertyStatus } from "@/types/api";
import RoomTypesDrawer from "./RoomTypesDrawer";
import DeletePropertyModal from "./DeletePropertyModal";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Draft", value: "draft" },
  { label: "Paused", value: "paused" },
  { label: "Archived", value: "archived" },
];

const HEADERS = ["Name", "Type", "Location", "Status", "Created", "Actions"];

export default function DashboardProperties() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editPropertyId, setEditPropertyId] = useState<string | null>(null);
  const [roomTypePropertyId, setRoomTypePropertyId] = useState<string | null>(
    null,
  );
  const [roomTypeId, setRoomTypeId] = useState<string | null>(null);
  const [viewRoomsId, setViewRoomsId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [viewRoomTypesId, setViewRoomTypesId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<PropertyStatus | "">("");

  const { properties, isLoading } = useProperties();
  const all = (properties ?? []) as Property[];
  // find the property being viewed
  const viewProperty = properties.find((p) => p.id === viewRoomTypesId);

  const filtered = properties.filter(
    (p) => !statusFilter || p.status === statusFilter,
  );

  const handleOpenCreate = () => {
    setEditPropertyId(null);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditPropertyId(null);
  };

  return (
    <>
      <AnimatePresence>
        {modalOpen && (
          <PropertyModal
            isOpen={modalOpen}
            propertyId={editPropertyId}
            onClose={handleClose}
          />
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
            <h4 className="text-xl lg:text-2xl bold  text-[#17191c]">
              Properties
            </h4>
            <p className="text-sm text-[#64645f] mt-1 max-w-[420px]">
              Manage your listings, room types, and availability calendars.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-[#17191c] flex rounded-full items-center gap-2 hover:opacity-90 text-white text-sm p-3 px-4"
          >
            <Plus size={14} />
            Add Property
          </button>
        </div>

        <div className="flex items-center gap-3">
          <ChartSelect
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as PropertyStatus | "")}
            options={STATUS_OPTIONS}
          />
          <span className="text-sm text-[#a3a6af]">
            {filtered.length} propert{filtered.length === 1 ? "y" : "ies"}
          </span>
        </div>

        <div className="border border-[#e8e6e3] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8e6e3]">
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs text-[#a3a6af] uppercase whitespace-nowrap"
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
                    {HEADERS.map((h) => (
                      <td key={h} className="px-5 py-4">
                        <div className="h-4 rounded animate-pulse bg-[#f2f0ed] w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-[#a3a6af]"
                  >
                    No properties found. Click "Add Property" to create your
                    first listing.
                  </td>
                </tr>
              ) : (
                filtered.map((property) => (
                  <PropertyTableRow
                    key={property.id}
                    property={property}
                    onAddRoomType={(id) => setRoomTypeId(id)}
                    onViewRoomTypes={(id) => setViewRoomsId(id)}
                    onDeleteProperty={(id) => {
                      const p = all.find((x) => x.id === id);
                      if (p) setDeleteTarget({ id: p.id, name: p.name });
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {roomTypePropertyId && (
        <AnimatePresence>
          <CreateRoomTypeModal
            isOpen={Boolean(roomTypePropertyId)}
            propertyId={roomTypePropertyId}
            onClose={() => setRoomTypePropertyId(null)}
          />
        </AnimatePresence>
      )}

      <AnimatePresence>
        {viewRoomTypesId && viewProperty && (
          <RoomTypesDrawer
            propertyName={viewProperty.name}
            roomTypes={viewProperty.roomTypes ?? []}
            onClose={() => setViewRoomTypesId(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeletePropertyModal
            isOpen={Boolean(deleteTarget)}
            propertyId={deleteTarget.id}
            propertyName={deleteTarget.name}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
