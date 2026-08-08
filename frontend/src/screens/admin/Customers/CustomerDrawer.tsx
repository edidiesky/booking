import Drawer from "@/components/common/Drawer";
import DrawerField from "@/components/common/DrawerField";
import DrawerSection from "@/components/common/DrawerSection";
import { formatDate } from "@/utils/formatDate";
import type { AdminGuestSummary } from "@/types/api";

interface Props {
  guest: AdminGuestSummary;
  onClose: () => void;
}

export default function CustomerDrawer({ guest, onClose }: Props) {
  return (
    <Drawer title={`${guest.firstName} ${guest.lastName}`} subtitle={guest.email} onClose={onClose} widthClass="lg:w-[560px]">
      <DrawerSection label="Account">
        <DrawerField label="Email"           value={guest.email} />
        <DrawerField label="Phone"           value={guest.phone ?? "—"} />
        <DrawerField label="Status"          value={<span className="capitalize">{guest.status}</span>} />
        <DrawerField label="Email verified"  value={guest.isEmailVerified ? "Yes" : "No"} />
        <DrawerField label="Signed up via"   value={guest.googleId ? "Google" : "Email"} />
        <DrawerField label="Joined"          value={formatDate(guest.createdAt)} />
      </DrawerSection>
    </Drawer>
  );
}