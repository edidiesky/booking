import { Link } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import NotificationBell from "@/components/common/NotificationBell";
import {
  Calendar,
  CreditCard,
  Building2,
  Users,
  Palette,
  Settings,
  Shield,
  Bell,
  LayoutDashboard,
} from "lucide-react";
import AccountDropdown from "@/components/common/AccountDropdown";
import { useState } from "react";
import MobileSidebar from "./MobileSidebar";
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="w-full sticky top-0 z-40 border-b"
      style={{
        backgroundColor: "var(--color-canvas)",
        borderColor: "var(--color-fog)",
      }}
    >
      <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 h-[60px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f2f0ed] transition-colors"
          >
            <Menu size={18} style={{ color: "var(--color-ink)" }} />
          </button>
          {/* Search */}
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:opacity-70 outline-none"
            style={{ color: "var(--color-muted-stone)" }}
          >
            <Search size={15} />
            <span className="text-xs lg:text-[13px]hidden sm:block">
              Search or press ⌘K
            </span>
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NotificationBell />

          {/* View public site */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs lg:text-[13px] px-4 py-1.5 rounded-full border transition-opacity hover:opacity-70"
            style={{
              color: "var(--color-muted-stone)",
              borderColor: "var(--color-fog)",
            }}
          >
            View site
          </Link>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <AccountDropdown
              triggerLabel="My Account"
              profilePath="/dashboard/account"
              items={[
                {
                  label: "Dashboard",
                  to: "/dashboard",
                  icon: LayoutDashboard,
                  group: 0,
                },
                {
                  label: "Bookings",
                  to: "/dashboard/bookings",
                  icon: Calendar,
                  group: 0,
                },
                {
                  label: "Payments",
                  to: "/dashboard/payments",
                  icon: CreditCard,
                  group: 0,
                },
                {
                  label: "Properties",
                  to: "/dashboard/properties",
                  icon: Building2,
                  group: 0,
                },
                {
                  label: "Tenants",
                  to: "/dashboard/renters",
                  icon: Users,
                  group: 0,
                },
                {
                  label: "Appearance",
                  to: "/dashboard/account",
                  icon: Palette,
                  group: 0,
                },
                {
                  label: "Settings",
                  to: "/dashboard/account",
                  icon: Settings,
                  group: 0,
                },
                {
                  label: "Security",
                  to: "/dashboard/account",
                  icon: Shield,
                  group: 1,
                },
                {
                  label: "Notifications",
                  to: "/dashboard/account",
                  icon: Bell,
                  group: 1,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
