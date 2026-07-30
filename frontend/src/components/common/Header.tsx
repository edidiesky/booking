import { Link }        from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Calendar, User, CreditCard, Building2, Users,
  Palette, Settings, Shield, Bell, LayoutDashboard,
} from "lucide-react";
import { selectCurrentUser, selectIsAuthenticated } from "@/redux/slices/authSlice";
import AccountDropdown from "@/components/common/AccountDropdown";

export default function Header() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser     = useSelector(selectCurrentUser);
  const isHost          = currentUser?.userType.startsWith("host:") ?? false;

  
  return (
    <nav
      className="w-full sticky top-0 z-50"
      style={{ backgroundColor: "var(--color-canvas)", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
    >
      <div className="mx-auto px-6 lg:px-0 h-16 flex items-center justify-between max-w-screen-xl">
        <Link to="/" className="text-lg tracking-tight bold" style={{ color: "var(--color-ink)" }}>
          Booking
        </Link>

        <div className="hidden md:flex items-center gap-4">
          {["Properties", "How it works", "About"].map((item) => (
            <Link
              key={item}
              to={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-xs lg:text-xs transition-opacity px-4 py-2 rounded-full hover:bg-[#f5f5f3]"
              style={{ color: "var(--color-ink)" }}
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && currentUser ? (
            isHost ? (
              <AccountDropdown
                triggerLabel="My Account"
                profilePath="/dashboard/account"
                items={[
                  { label: "Dashboard",  to: "/dashboard",            icon: LayoutDashboard, group: 0 },
                  { label: "Bookings",   to: "/dashboard/bookings",   icon: Calendar,         group: 0 },
                  { label: "Payments",   to: "/dashboard/payments",   icon: CreditCard,       group: 0 },
                  { label: "Properties", to: "/dashboard/properties", icon: Building2,        group: 0 },
                  { label: "Tenants",    to: "/dashboard/renters",    icon: Users,            group: 0 },
                  { label: "Appearance", to: "/dashboard/account",    icon: Palette,          group: 0 },
                  { label: "Settings",   to: "/dashboard/account",    icon: Settings,         group: 0 },
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
            ) : (
              <AccountDropdown
                triggerLabel="My Account"
                profilePath="/profile"
                items={[
                  { label: "My Trips",   to: "/profile?tab=trips",        icon: Calendar, group: 0 },
                  { label: "Profile",    to: "/profile?tab=account",      icon: User,     group: 0 },
                  { label: "Appearance", to: "/profile?tab=account",      icon: Palette,  group: 0 },
                  { label: "Settings",   to: "/profile?tab=account",      icon: Settings, group: 0 },
                  {
                    label: "Security",
                    to: "/profile?tab=security",
                    icon: Shield,
                    group: 1,
                  },
                  {
                    label: "Notifications",
                    to: "/profile?tab=notifications",
                    icon: Bell,
                    group: 1,
                  },
                ]}
              />
            )
          ) : (
            <>
              <Link
                to="/login"
                className="h-9 px-5 text-xs transition-opacity hover:opacity-70 flex items-center rounded-full"
                style={{ color: "var(--color-ink)" }}
              >
                Log in
              </Link>
              <Link
                to="/onboarding"
                className="h-9 px-5 text-xs transition-opacity hover:opacity-80 flex items-center rounded-full"
                style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}