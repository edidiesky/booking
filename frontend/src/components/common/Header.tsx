import { Link }        from "react-router-dom";
import { useSelector } from "react-redux";
import { Calendar, User } from "lucide-react";
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
              className="text-xs lg:text-sm transition-opacity px-4 py-2 rounded-full hover:bg-[#f5f5f3]"
              style={{ color: "var(--color-ink)" }}
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && currentUser ? (
            isHost ? (
              <Link
                to="/dashboard"
                className="h-9 px-5 text-sm transition-opacity hover:opacity-80 flex items-center rounded-full"
                style={{ backgroundColor: "#f5f5f3", color: "var(--color-canvas)" }}
              >
                Dashboard
              </Link>
            ) : (
              <AccountDropdown
                triggerLabel="My Account"
                profilePath="/profile"
                items={[
                  { label: "My Trips", to: "/trips",   icon: Calendar, group: 0 },
                  { label: "Profile",  to: "/profile",  icon: User,     group: 0 },
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

