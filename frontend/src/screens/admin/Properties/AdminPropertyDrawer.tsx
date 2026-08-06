import { formatDate } from "@/utils/formatDate";
import Drawer from "@/components/common/Drawer";
import DrawerField from "@/components/common/DrawerField";
import DrawerSection from "@/components/common/DrawerSection";
import LazyImage from "@/components/common/LazyImage";
import type { Property } from "@/types/api";

interface Props {
  property: Property & { tenantName: string };
  onClose: () => void;
}

export default function AdminPropertyDrawer({ property, onClose }: Props) {
  return (
    <Drawer title={property.name} subtitle={property.tenantName} onClose={onClose} widthClass="lg:w-[640px]">
      <DrawerSection label="Property">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#f2f0ed] shrink-0">
            {property.images?.[0] ? (
              <LazyImage src={property.images[0]} alt={property.name} />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs bold text-[#17191c] truncate">{property.name}</p>
            <p className="text-xs text-[#777b86]">{property.address.city}, {property.address.state}</p>
          </div>
        </div>
      </DrawerSection>

      <DrawerSection label="Details">
        <DrawerField label="Seller"     value={property.tenantName} />
        <DrawerField label="Type"       value={<span className="capitalize">{property.property_type}</span>} />
        <DrawerField label="Status"     value={<span className="capitalize">{property.status}</span>} />
        <DrawerField label="Check-in"   value={property.checkInTime} />
        <DrawerField label="Check-out"  value={property.checkOutTime} />
        <DrawerField label="Listed"     value={formatDate(property.createdAt)} />
      </DrawerSection>

      <div className="border-t sticky bottom-0 left-0 bg-white border-[#e8e6e3] px-6 py-4 flex items-center justify-between">
        <button onClick={onClose} className="text-xs text-[#777b86] bold hover:text-[#17191c]">
          Close
        </button>
      </div>
    </Drawer>
  );
}