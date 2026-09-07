import type { ReactNode } from "react";
import {
  ArrowLeft,
  MoreHorizontal,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Avatar from "@/components/common/Avatar";

export type ProfileTab = {
  key: string;
  label: string;
};

interface ProfilePageShellProps {
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
  statusLabel?: string;
  statusTone?: "active" | "inactive" | "suspended";
  secondaryId?: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onBack?: () => void;
  tabs: ProfileTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  main: ReactNode;
  sidebar: ReactNode;
}

const STATUS_STYLES = {
  active: "bg-[#dcfce7] text-[#166534]",
  inactive: "bg-[#f3f4f6] text-[#374151]",
  suspended: "bg-[#fee2e2] text-[#991b1b]",
} as const;

export default function ProfilePageShell({
  name,
  email,
  avatarUrl,
  statusLabel = "Active",
  statusTone = "active",
  secondaryId,
  primaryActionLabel = "Send Message",
  onPrimaryAction,
  onBack,
  tabs,
  activeTab,
  onTabChange,
  main,
  sidebar,
}: ProfilePageShellProps) {
  return (
    <div className="w-full min-h-screen bg-[#f7f7f5]">
      <div className="max-w-screen-xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8 flex flex-col gap-6">
        {/* Top: identity left · actions right */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-2 w-8 h-8 rounded-lg flex items-center justify-center text-[#777b86] hover:bg-white hover:text-[#17191c] transition-colors shrink-0"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <Avatar
              src={avatarUrl}
              email={email}
              name={name}
              size={74}
              className="ring-2 ring-white shadow-sm"
            />

            <div className="min-w-0 pt-0.5">
              <h1 className="text-2xl lg:text-3xl font-bold text-[#17191c] leading-tight truncate">
                {name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[statusTone]}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                  {statusLabel}
                </span>
                {secondaryId && (
                  <span className="text-xs text-[#a3a6af]">{secondaryId}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="w-9 h-9 rounded-lg border border-[#e8e6e3] bg-white flex items-center justify-center text-[#777b86] hover:bg-[#fafaf9]"
              aria-label="More"
            >
              <MoreHorizontal size={16} />
            </button>
            {onPrimaryAction && (
              <button
                type="button"
                onClick={onPrimaryAction}
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-[#e8e6e3] bg-white text-sm font-medium text-[#17191c] hover:bg-[#fafaf9]"
              >
                <MessageSquare size={15} className="text-[#777b86]" />
                {primaryActionLabel}
              </button>
            )}
            <div className="hidden sm:flex items-center border border-[#e8e6e3] rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                className="w-8 h-9 flex items-center justify-center text-[#c4c6ce] border-r border-[#e8e6e3]"
                disabled
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="w-8 h-9 flex items-center justify-center text-[#c4c6ce]"
                disabled
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#e8e6e3]">
          <nav className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onTabChange(t.key)}
                  className={`relative px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
                    active
                      ? "text-[#17191c] font-semibold border-black border-b-4"
                      : "text-[#a3a6af] hover:text-[#777b86]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main 80% · sidebar 20% */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6 lg:gap-8 items-start">
          <div className="w-full">{main}</div>
          <aside className="w-full">
            {sidebar}
          </aside>
        </div>
      </div>
    </div>
  );
}
