import StatusBadge    from "@/components/common/StatusBadge";
import { formatDate } from "@/utils/formatDate";
import type { Property } from "@/types/api";

interface Props {
  property:       Property;
  onAddRoomType:  (propertyId: string) => void;
}

const typeLabel: Record<string, string> = {
  shortlet:   "Shortlet",
  hotel:      "Hotel",
  guesthouse: "Guesthouse",
};

export default function PropertyTableRow({ property, onAddRoomType }: Props) {
  return (
    <tr className="border-b last:border-0 transition-colors hover:bg-[#fafaf9]"
        style={{ borderColor: "#f2f0ed" }}>
      <td className="px-5 py-3 font-semibold text-sm whitespace-nowrap"
          style={{ color: "var(--color-ink)" }}>
        {property.name}
      </td>
      <td className="px-5 py-3 text-sm whitespace-nowrap"
          style={{ color: "var(--color-muted-stone)" }}>
        {typeLabel[property.propertyType] ?? property.propertyType}
      </td>
      <td className="px-5 py-3 text-sm whitespace-nowrap"
          style={{ color: "var(--color-muted-stone)" }}>
        {property.address.city}, {property.address.state}
      </td>
      <td className="px-5 py-3">
        <StatusBadge status={property.status} />
      </td>
      <td className="px-5 py-3 text-sm whitespace-nowrap"
          style={{ color: "var(--color-muted-stone)" }}>
        {formatDate(property.createdAt)}
      </td>
      <td className="px-5 py-3">
        <button
          onClick={() => onAddRoomType(property.id)}
          className="text-xs px-3 py-1.5 rounded-full border transition-opacity hover:opacity-70"
          style={{ borderColor: "var(--color-ink)", color: "var(--color-ink)" }}
        >
          + Room Type
        </button>
      </td>
    </tr>
  );
}