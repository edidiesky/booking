import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PropertyTableRow from "./PropertyTableRow";
import PropertyModal from "./PropertyModal";
import CreateRoomTypeModal from "./CreateRoomTypeModal";
import DeletePropertyModal from "./DeletePropertyModal";
import { useProperties } from "./hooks/useProperties";
import { ChartSelect } from "@/components/common/charts/Chartselect";
import type { PropertyStatus } from "@/types/api";
import { useNavigate } from "react-router-dom";
import StatsOverview from "@/components/dashboard/common/StatsOverview";
import ExportPdfButton from "@/components/common/ExportPdfButton";
import { PROPERTY_URL } from "@/constants/api";
import ImportRoomTypesModal from "./ImportRoomTypesModal";
import Title from "@/components/dashboard/common/Title";

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
  const [roomTypeId, setRoomTypeId] = useState<string | null>(null);
  const [showImportPicker, setShowImportPicker] = useState(false);
  const [importPropertyId, setImportPropertyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | "">("");
  const navigate = useNavigate();

  const { properties, isLoading, stats, isStatsLoading } = useProperties();

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

  const handleOpenEdit = (id: string) => {
    setEditPropertyId(id);
    setModalOpen(true);
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
        <div className="flex items-start justify-between lg:flex-row flex-col gap-4">
          <Title
            title={`Properties`}
            description="Manage your listings, room types, and availability calendars."
          />
          <div className="flex items-center gap-2 lg:justify-end">
            <div className="relative">
              <button
                onClick={() => setShowImportPicker((v) => !v)}
                className="border border-[#e8e6e3] flex rounded-full items-center gap-2 hover:bg-[#f2f0ed] transition-colors text-[#17191c] text-xs lg:text-sm p-2 bold px-6"
              >
                Bulk Import
              </button>
              {showImportPicker && (
                <div
                  className="absolute right-0 mt-1.5 w-64 bg-white border rounded-xl shadow-lg z-30 p-2"
                  style={{ borderColor: "#e8e6e3" }}
                >
                  <p
                    className="text-[11px] px-2 py-1"
                    style={{ color: "#a3a6af" }}
                  >
                    Choose which property this CSV is for:
                  </p>
                  {properties.length === 0 ? (
                    <p
                      className="text-xs lg:text-smpx-2 py-2"
                      style={{ color: "#a3a6af" }}
                    >
                      Add a property first.
                    </p>
                  ) : (
                    properties.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setImportPropertyId(p.id);
                          setShowImportPicker(false);
                        }}
                        className="w-full text-left text-xs lg:text-smpx-2 py-2 rounded-lg hover:bg-[#f2f0ed] transition-colors truncate"
                        style={{ color: "#17191c" }}
                      >
                        {p.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleOpenCreate}
              className="bg-[#17191c] flex rounded-full items-center gap-2 hover:opacity-90 text-white text-xs lg:text-sm p-2 bold px-6"
            >
              Add Property
            </button>
          </div>
        </div>

        <StatsOverview
          isLoading={isStatsLoading}
          growthPct={stats?.newListingsGrowthPct}
          growthLabel="new listings this month"
          growthTooltip="New listings created this calendar month vs. last calendar month"
          cards={[
            {
              label: "Active",
              value: String(stats?.activeCount ?? 0),
              color: "#166534",
              bg: "#dcfce7",
            },
            {
              label: "Draft",
              value: String(stats?.draftCount ?? 0),
              color: "#92400e",
              bg: "#fef3c7",
            },
            {
              label: "Paused",
              value: String(stats?.pausedCount ?? 0),
              color: "#374151",
              bg: "#f3f4f6",
            },
            {
              label: "Archived",
              value: String(stats?.archivedCount ?? 0),
              color: "#991b1b",
              bg: "#fee2e2",
            },
          ]}
        />
        <div className="w-full flex lg:items-center justify-between lg:flex-row flex-col gap-3">
          <div className="flex items-center gap-3">
            <ChartSelect
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as PropertyStatus | "")}
              options={STATUS_OPTIONS}
            />
            <span className="text-xs lg:text-sm text-[#a3a6af]">
              {filtered.length} propert{filtered.length === 1 ? "y" : "ies"}
            </span>
          </div>
          <div className="flex lg:justify-end">
            <ExportPdfButton
              triggerUrl={`${PROPERTY_URL}/mine/export`}
              label="Export Property PDF"
            />
          </div>
        </div>

        <div className="border border-[#e8e6e3] overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e8e6e3]">
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs lg:text-xs text-[#a3a6af] uppercase whitespace-nowrap"
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
                    className="px-5 py-10 text-center text-xs lg:text-sm text-[#a3a6af]"
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
                    onOpenProperty={(id) =>
                      navigate(`/dashboard/properties/${id}`)
                    }
                    onEditProperty={handleOpenEdit}
                    onDeleteProperty={(property) =>
                      setDeleteTarget({ id: property.id, name: property.name })
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {roomTypeId && (
          <CreateRoomTypeModal
            isOpen={Boolean(roomTypeId)}
            propertyId={roomTypeId}
            onClose={() => setRoomTypeId(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {importPropertyId && (
          <ImportRoomTypesModal
            propertyId={importPropertyId}
            onClose={() => setImportPropertyId(null)}
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
