// SidebarFooter.tsx, now the visible block itself opens the dropdown
import AccountDropdown from "@/components/common/AccountDropdown";
import { LuSettings } from "react-icons/lu";
import { Settings, HelpCircle } from "lucide-react";
import type { User } from "@/types/api";

interface Props {
  currentUser: User | null;
  onSignOut:   () => void;
}

export default function SidebarFooter({ currentUser }: Props) {
  const fullName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") || "My Account";

  return (
    <div className="border-t p-3 lg:pb-12 shrink-0" style={{ borderColor: "#ebebeb" }}>
      <AccountDropdown
        triggerLabel={fullName}
        profilePath="/dashboard/account"
        trigger={
          <button className="flex items-center gap-2.5 px-2 py-2 rounded-[8px] hover:bg-[#f5f5f3] transition-colors mb-1 w-full">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs lg:text-[13px] text-white shrink-0"
              style={{ backgroundColor: "var(--color-ink)" }}
            >
              {currentUser?.firstName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs lg:text-[13px] truncate" style={{ color: "var(--color-ink)" }}>
                {currentUser?.firstName} {currentUser?.lastName}
              </p>
              <p className="text-xs lg:text-[13px]truncate" style={{ color: "var(--color-hint-of-grey)" }}>
                {currentUser?.userType}
              </p>
            </div>
            <LuSettings size={13} style={{ color: "var(--color-hint-of-grey)" }} className="shrink-0" />
          </button>
        }
        items={[
          { label: "Account settings", to: "/dashboard/account", icon: Settings, group: 0 },
          { label: "Help & support", to: "/dashboard/support", icon: HelpCircle, group: 0 },
        ]}
      />
    </div>
  );
}