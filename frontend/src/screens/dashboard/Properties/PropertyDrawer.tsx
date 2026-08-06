import Drawer from "@/components/common/Drawer";
import DrawerField from "@/components/common/DrawerField";
import DrawerSection from "@/components/common/DrawerSection";
import { formatDate } from "@/utils/formatDate";
import type { Property } from "@/types/api";

export default function PropertyDrawer({ property, onClose }: { property: Property & { tenant_name: string }; onClose: () => void }) {
  return (
    <Drawer title={property.name} subtitle={property.tenant_name} onClose={onClose} widthClass="lg:w-[640px]">
      <DrawerSection label="Property">
        <DrawerField label="Seller" value={property.tenant_name} />
        <DrawerField label="Type" value={<span className="capitalize">{property.property_type}</span>} />
        <DrawerField label="Status" value={<span className="capitalize">{property.status}</span>} />
        <DrawerField label="City" value={`${property.address.city}, ${property.address.state}`} />
        <DrawerField label="Check-in" value={property.checkInTime} />
        <DrawerField label="Check-out" value={property.checkOutTime} />
        <DrawerField label="Listed" value={formatDate(property.createdAt)} />
      </DrawerSection>
    </Drawer>
  );
}