import { Eye, Plus, Trash2, Pencil } from "lucide-react";
import RowActionsMenu   from "@/components/common/RowActionsMenu";
import type { Property } from "@/types/api";
import { formatDateTime } from "@/utils/formatDate";

const STATUS_CFG: Record<string, { label: string; className: string }> = {
  active:   { label: "Active",   className: "bg-green-50 text-green-700"   },
  draft:    { label: "Draft",    className: "bg-[#f2f0ed] text-[#4c4c4c]" },
  paused:   { label: "Paused",   className: "bg-yellow-50 text-yellow-800" },
  archived: { label: "Archived", className: "bg-red-50 text-red-700"      },
};

interface Props {
  property:         Property;
  onAddRoomType:    (id: string) => void;
  onOpenProperty:   (id: string) => void;
  onEditProperty:   (id: string) => void;
  onDeleteProperty: (property: Property) => void;
  onPropertyPerformanceModalOpen: (property: Property) => void;
}
export default function PropertyTableRow({
  property,
  onAddRoomType,
  onOpenProperty,
  onEditProperty,
  onDeleteProperty,
  onPropertyPerformanceModalOpen
}: Props) {
  const cfg       = STATUS_CFG[property.status] ?? { label: property.status, className: "bg-[#f2f0ed] text-[#4c4c4c]" };
  const roomCount = property.roomTypes?.length ?? 0;

  return (
    <tr
      onClick={() => onOpenProperty(property.id)}
      className="border-b border-[#f2f0ed] last:border-0 hover:bg-[#fafaf9] transition-colors cursor-pointer"
    >
      <td className="px-5 py-3 text-[#17191c] whitespace-nowrap">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs lg:text-[13px]     medium">{property.name}</span>
          {roomCount > 0 && (
            <span className="text-xs lg:text-[13px]     text-[#a3a6af]">{roomCount} room type{roomCount !== 1 ? "s" : ""}</span>
          )}
        </div>
      </td>
      <td className="px-5 py-3 capitalize text-xs lg:text-[13px]     text-[#4c4c4c]">{property.property_type}</td>
      <td className="px-5 py-3 text-xs lg:text-[13px]     text-[#777b86] whitespace-nowrap">{property.address.city}, {property.address.state}</td>
      <td className="px-5 py-3">
        <span className={`text-xs lg:text-[13px]     medium px-3 py-1 rounded-full ${cfg.className}`}>{cfg.label}</span>
      </td>
      <td className="px-5 py-3 text-xs lg:text-[13px]     text-[#777b86]">{formatDateTime(property.createdAt)}</td>
      <td className="px-5 py-3 text-right">
        <RowActionsMenu
          actions={[
            { label: "Add room type", icon: Plus, onClick: () => onAddRoomType(property.id) },
            { label: "View Details",  icon: Eye,  onClick: () => onPropertyPerformanceModalOpen(property) },
            { label: "View Room Types",  icon: Eye,  onClick: () => onOpenProperty(property.id) },
            { label: "Edit property", icon: Pencil, onClick: () => onEditProperty(property.id) },
            { label: "Delete property", icon: Trash2, onClick: () => onDeleteProperty(property), variant: "danger", separator: true },
          ]}
        />
      </td>
    </tr>
  );
}