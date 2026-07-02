import { useSelector }          from "react-redux";
import { Link }                  from "react-router-dom";
import { Bell, Search }          from "lucide-react";
import { selectCurrentUser }     from "@/redux/slices/authSlice";

export default function Header() {
  const currentUser = useSelector(selectCurrentUser);

  const initials = currentUser
    ? `${currentUser.firstName?.charAt(0) ?? ""}${currentUser.lastName?.charAt(0) ?? ""}`.toUpperCase()
    : "?";

  const displayName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : "";

  return (
    <header
      className="w-full sticky top-0 z-40 border-b"
      style={{ backgroundColor: "var(--color-canvas)", borderColor: "var(--color-fog)" }}
    >
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 h-[60px] flex items-center justify-between">

        {/* Search */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:opacity-70 outline-none"
          style={{ color: "var(--color-muted-stone)" }}
        >
          <Search size={15} />
          <span className="text-sm hidden sm:block">Search or press ⌘K</span>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Notifications */}
          <button
            className="relative w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:opacity-70 outline-none"
            style={{ color: "var(--color-muted-stone)" }}
            title="Notifications"
          >
            <Bell size={16} />
          </button>

          {/* View public site */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-sm bold px-4 py-1.5 rounded-full border transition-opacity hover:opacity-70"
            style={{
              color:       "var(--color-muted-stone)",
              borderColor: "var(--color-fog)",
            }}
          >
            View site 
          </Link>

          {/* User avatar */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm bold  shrink-0"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
            >
              {initials}
            </div>
            <span
              className="text-base bold hidden md:block truncate max-w-[140px]"
              style={{ color: "var(--color-ink)" }}
            >
              {displayName}
            </span>
          </div>

        </div>
      </div>
    </header>
  );
}