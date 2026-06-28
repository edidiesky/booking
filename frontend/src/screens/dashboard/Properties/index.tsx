import { useState }             from "react";
import { motion }               from "framer-motion";
import { Plus }                 from "lucide-react";
import Title                    from "@/components/dashboard/common/Title";
import PropertyTableRow         from "./PropertyTableRow";
import CreatePropertyModal      from "./CreatePropertyModal";
import CreateRoomTypeModal      from "./CreateRoomTypeModal";
import { useProperties }        from "./hooks/useProperties";
import type { PropertyStatus }  from "@/types/api";

const STATUS_OPTIONS: { label: string; value: PropertyStatus | "" }[] = [
  { label: "All",      value: ""         },
  { label: "Active",   value: "active"   },
  { label: "Draft",    value: "draft"    },
  { label: "Paused",   value: "paused"   },
  { label: "Archived", value: "archived" },
];

const HEADERS = ["Name", "Type", "Location", "Status", "Created", "Actions"];

export default function DashboardProperties() {
  const [showCreateProperty, setShowCreateProperty] = useState(false);
  const [roomTypePropertyId, setRoomTypePropertyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter]             = useState<PropertyStatus | "">("");

  const {
    properties, isLoading,
    handleCreateProperty, creating,
    handleCreateRoomType, creatingRoom,
  } = useProperties();

  const filtered = properties.filter((p) => !statusFilter || p.status === statusFilter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <Title
          title="Properties"
          description="Manage your listings, room types, and availability calendars."
        />
        <button
          onClick={() => setShowCreateProperty(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-full text-sm transition-opacity hover:opacity-80 shrink-0"
          style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
        >
          <Plus size={14} />
          Add Property
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_OPTIONS.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(value)}
            className="px-3 py-1.5 text-xs rounded-full border transition-colors"
            style={{
              backgroundColor: statusFilter === value ? "var(--color-ink)"    : "transparent",
              color:           statusFilter === value ? "var(--color-canvas)"  : "var(--color-muted-stone)",
              borderColor:     statusFilter === value ? "var(--color-ink)"    : "var(--color-fog)",
            }}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs" style={{ color: "var(--color-muted-stone)" }}>
          {filtered.length} propert{filtered.length === 1 ? "y" : "ies"}
        </span>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-x-auto" style={{ borderColor: "var(--color-fog)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--color-fog)" }}>
              {HEADERS.map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs uppercase whitespace-nowrap"
                    style={{ color: "var(--color-muted-stone)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b" style={{ borderColor: "var(--color-fog)" }}>
                  {HEADERS.map((h) => (
                    <td key={h} className="px-5 py-4">
                      <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#f2f0ed", width: "70%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm"
                    style={{ color: "var(--color-muted-stone)" }}>
                  No properties found. Click "Add Property" to create your first listing.
                </td>
              </tr>
            ) : (
              filtered.map((property) => (
                <PropertyTableRow
                  key={property.id}
                  property={property}
                  onAddRoomType={(id) => setRoomTypePropertyId(id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCreateProperty && (
        <CreatePropertyModal
          onClose={() => setShowCreateProperty(false)}
          onSubmit={handleCreateProperty}
          isSaving={creating}
        />
      )}

      {roomTypePropertyId && (
        <CreateRoomTypeModal
          propertyId={roomTypePropertyId}
          onClose={() => setRoomTypePropertyId(null)}
          onSubmit={handleCreateRoomType}
          isSaving={creatingRoom}
        />
      )}
    </motion.div>
  );
}