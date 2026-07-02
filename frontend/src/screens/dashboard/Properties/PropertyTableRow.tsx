import { formatDate }     from "@/utils/formatDate";
import type { Property }  from "@/types/api";

const STATUS_CFG: Record<string, { label: string; className: string }> = {
  active:   { label: "Active",   className: "bg-green-50 text-green-700"  },
  draft:    { label: "Draft",    className: "bg-[#f2f0ed] text-[#4c4c4c]"},
  paused:   { label: "Paused",   className: "bg-yellow-50 text-yellow-800"},
  archived: { label: "Archived", className: "bg-red-50 text-red-700"     },
};

interface Props {
  property:      Property;
  onEdit:        (id: string) => void;
  onAddRoomType: (id: string) => void;
}

export default function PropertyTableRow({ property, onEdit, onAddRoomType }: Props) {
  const cfg = STATUS_CFG[property.status] ?? { label: property.status, className: "bg-[#f2f0ed] text-[#4c4c4c]" };

  return (
    <tr className="border-b border-[#f2f0ed] last:border-0 hover:bg-[#fafaf9] transition-colors">
      <td className="px-5 py-3 font-semibold text-[#17191c] whitespace-nowrap">
        {property.name}
      </td>
      <td className="px-5 py-3 capitalize text-[#4c4c4c]">
        {property.propertyType}
      </td>
      <td className="px-5 py-3 text-[#777b86] whitespace-nowrap">
        {property.address.city}, {property.address.state}
      </td>
      <td className="px-5 py-3">
        <span className={`text-xs px-2 py-0.5 ${cfg.className}`}>{cfg.label}</span>
      </td>
      <td className="px-5 py-3 text-[#777b86]">
        {formatDate(property.createdAt)}
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(property.id)}
            className="text-xs px-3 py-1.5 border border-[#e8e6e3] text-[#4c4c4c] hover:bg-[#f2f0ed] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onAddRoomType(property.id)}
            className="text-xs px-3 py-1.5 bg-[#17191c] text-white hover:opacity-90 transition-opacity"
          >
            Add Room Type
          </button>
        </div>
      </td>
    </tr>
  );
}