import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import AccountDropdown from "@/components/common/AccountDropdown";

export default function AdminHeader() {
  return (
    <header
      className="w-full sticky top-0 z-40 border-b"
      style={{ backgroundColor: "var(--color-canvas)", borderColor: "var(--color-fog)" }}
    >
      <div className="px-6 h-[60px] flex items-center justify-between">
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:opacity-70 outline-none"
          style={{ color: "var(--color-muted-stone)" }}
        >
          <Search size={15} />
          <span className="text-xs hidden sm:block">Search or press ⌘K</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[10px] bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
            Platform Admin
          </span>
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs bold px-4 py-1.5 rounded-full border transition-opacity hover:opacity-70"
            style={{ color: "var(--color-muted-stone)", borderColor: "var(--color-fog)" }}
          >
            View site
          </Link>
          <AccountDropdown triggerLabel="My Account" profilePath="/dashboard/account" items={[]} />
        </div>
      </div>
    </header>
  );
}