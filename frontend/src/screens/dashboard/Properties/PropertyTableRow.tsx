import { MoreHorizontal }   from "lucide-react";
import moment               from "moment";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Property } from "@/types/api";

const STATUS_CFG: Record<string, { label: string; className: string }> = {
  active:   { label: "Active",   className: "bg-green-50 text-green-700"   },
  draft:    { label: "Draft",    className: "bg-[#f2f0ed] text-[#4c4c4c]" },
  paused:   { label: "Paused",   className: "bg-yellow-50 text-yellow-800" },
  archived: { label: "Archived", className: "bg-red-50 text-red-700"      },
};

interface Props {
  property:         Property;
  onAddRoomType:    (id: string) => void;
  onViewRoomTypes:  (id: string) => void;
  onDeleteProperty: (id: string) => void;
}

export default function PropertyTableRow({
  property,
  onAddRoomType,
  onViewRoomTypes,
  onDeleteProperty,
}: Props) {
  const cfg       = STATUS_CFG[property.status] ?? { label: property.status, className: "bg-[#f2f0ed] text-[#4c4c4c]" };
  const roomCount = property.roomTypes?.length ?? 0;

  return (
    <tr className="border-b border-[#f2f0ed] last:border-0 hover:bg-[#fafaf9] transition-colors">
      <td className="px-5 py-3 text-[#17191c] whitespace-nowrap">
        <div className="flex flex-col gap-0.5">
          <span className="text-base bold">{property.name}</span>
          {roomCount > 0 && (
            <span className="text-sm text-[#a3a6af]">
              {roomCount} room type{roomCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-3 capitalize text-sm text-[#4c4c4c]">
        {property.property_type}
      </td>
      <td className="px-5 py-3 text-sm text-[#777b86] whitespace-nowrap">
        {property.address.city}, {property.address.state}
      </td>
      <td className="px-5 py-3">
        <span className={`text-sm bold px-3 py-1 ${cfg.className}`}>
          {cfg.label}
        </span>
      </td>
      <td className="px-5 py-3 text-sm text-[#777b86]">
        {moment(property.createdAt).format("DD MMM YYYY")}
      </td>
      <td className="px-5 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-[#f2f0ed] transition-colors rounded-full outline-none">
              <MoreHorizontal size={16} className="text-[#4c4c4c]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52 bg-white border border-[#e8e6e3] rounded-xl shadow-lg p-1"
          >
            <DropdownMenuItem
              onClick={() => onAddRoomType(property.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#17191c] cursor-pointer hover:bg-[#f2f0ed] rounded-lg outline-none"
            >
              Add room type
            </DropdownMenuItem>

            {roomCount > 0 && (
              <DropdownMenuItem
                onClick={() => onViewRoomTypes(property.id)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#17191c] cursor-pointer hover:bg-[#f2f0ed] rounded-lg outline-none"
              >
                View room types
                <span className="ml-auto text-sm text-[#a3a6af]">{roomCount}</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="my-1 border-[#f2f0ed]" />

            <DropdownMenuItem
              onClick={() => onDeleteProperty(property.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 cursor-pointer hover:bg-red-50 rounded-lg outline-none"
            >
              Delete property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}