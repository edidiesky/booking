import { Link }          from "react-router-dom";
import { LuSettings, LuLogOut } from "react-icons/lu";
import type { User }     from "@/types/api";

interface Props {
  currentUser: User | null;
  onSignOut:   () => void;
}

export default function SidebarFooter({ currentUser, onSignOut }: Props) {
  return (
    <div className="border-t p-3 shrink-0" style={{ borderColor: "#ebebeb" }}>
      <Link
        to="/dashboard/account"
        className="flex items-center gap-2.5 px-2 py-2 rounded-[8px] hover:bg-[#f5f5f3] transition-colors mb-1 w-full"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm text-white shrink-0"
          style={{ backgroundColor: "var(--color-ink)" }}
        >
          {currentUser?.firstName?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm bold truncate" style={{ color: "var(--color-ink)" }}>
            {currentUser?.firstName} {currentUser?.lastName}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--color-hint-of-grey)" }}>
            {currentUser?.email}
          </p>
        </div>
        <LuSettings size={13} style={{ color: "var(--color-hint-of-grey)" }} className="shrink-0" />
      </Link>

      <button
        onClick={onSignOut}
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] transition-colors w-full hover:bg-[#fff0f0]"
        style={{ color: "var(--color-light-steel)" }}
      >
        <LuLogOut size={14} className="shrink-0" />
        Sign out
      </button>
    </div>
  );
}