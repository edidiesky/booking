import {
  Bell,
  Building2,
  Calendar,
  CreditCard,
  Heart,
  LayoutDashboard,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react";
import AccountDropdown from "@/components/common/AccountDropdown";

/** Account menu, unchanged behaviour from the previous header. */
export default function HeaderAccount({ isHost }: { isHost: boolean }) {
  if (isHost) {
    return (
      <AccountDropdown
        triggerLabel="My account"
        profilePath="/dashboard/account"
        items={[
          { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, group: 0 },
          { label: "Bookings", to: "/dashboard/bookings", icon: Calendar, group: 0 },
          { label: "Payments", to: "/dashboard/payments", icon: CreditCard, group: 0 },
          { label: "Properties", to: "/dashboard/properties", icon: Building2, group: 0 },
          { label: "Guests", to: "/dashboard/renters", icon: Users, group: 0 },
          { label: "Settings", to: "/dashboard/account", icon: Settings, group: 0 },
          { label: "Security", to: "/dashboard/account", icon: Shield, group: 1 },
          { label: "Notifications", to: "/dashboard/account", icon: Bell, group: 1 },
        ]}
      />
    );
  }
  return (
    <AccountDropdown
      triggerLabel="My account"
      profilePath="/profile"
      items={[
        { label: "My trips", to: "/profile?tab=trips", icon: Calendar, group: 0 },
        { label: "Saved stays", to: "/favorites", icon: Heart, group: 0 },
        { label: "Profile", to: "/profile?tab=account", icon: User, group: 0 },
        { label: "Settings", to: "/profile?tab=account", icon: Settings, group: 0 },
        { label: "Security", to: "/profile?tab=security", icon: Shield, group: 1 },
        { label: "Notifications", to: "/profile?tab=notifications", icon: Bell, group: 1 },
      ]}
    />
  );
}
