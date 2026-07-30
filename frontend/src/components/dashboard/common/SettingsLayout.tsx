import { ChevronRight, ChevronLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface SettingsNavItem {
  key:      string;
  label:    string;
  icon:     LucideIcon;
  badge?:   ReactNode;
}

export interface SettingsNavGroup {
  title: string;
  items: SettingsNavItem[];
}

interface Props {
  headerName:     string;
  headerSubtitle?: string;
  headerAction?:  ReactNode;
  groups:         SettingsNavGroup[];
  activeKey:      string | null;
  onSelect:       (key: string) => void;
  panelTitle?:    string;
  children:       ReactNode;
}

export default function SettingsLayout({
  headerName, headerSubtitle, headerAction,
  groups, activeKey, onSelect, panelTitle, children,
}: Props) {
  const showDetailOnMobile = activeKey !== null;

  return (
    <div className="w-full flex flex-col lg:flex-row items-start bg-white">
      {/* Left: identity header + grouped nav list. Ordinary flowing
          content, scrolls with the page. */}
      <div
        className={`w-full lg:w-[520px] shrink-0 border-b lg:border-b-0 lg:border-r flex flex-col ${showDetailOnMobile ? "hidden lg:flex" : "flex"}`}
        style={{ borderColor: "#e8e6e3" }}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-11 h-11 rounded-full flex items-center justify-center text-xs lg:text-lg bold shrink-0"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
            >
              {headerName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-xs lg:text-xs bold truncate" style={{ color: "var(--color-ink)" }}>{headerName}</p>
              {headerSubtitle && (
                <p className="text-xs truncate" style={{ color: "#777b86" }}>{headerSubtitle}</p>
              )}
            </div>
          </div>
          {headerAction}
        </div>

        <nav className="flex-1 py-2">
          {groups.map((group) => (
            <div key={group.title} className="px-2 py-2">
              <p className="text-[10px] uppercase tracking-widest px-3 py-1.5" style={{ color: "#a3a6af" }}>
                {group.title}
              </p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.key === activeKey;
                  return (
                    <button
                      key={item.key}
                      onClick={() => onSelect(item.key)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                      style={{
                        backgroundColor: active ? "#f2f0ed" : "transparent",
                        color: "var(--color-ink)",
                      }}
                    >
                      <Icon size={16} style={{ color: "#4c4c4c" }} className="shrink-0" />
                      <span className="text-xs bold flex-1">{item.label}</span>
                      {item.badge}
                      <ChevronRight size={14} style={{ color: "#a3a6af" }} className="shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Right: detail panel. Sticks in place at the top as the left nav
          scrolls past it, its own content scrolls internally if it's
          taller than the viewport. */}
      <div
        className={`flex-1 w-full flex flex-col items-center sticky top-4 ${showDetailOnMobile ? "flex" : "hidden lg:flex"}`}
        style={{ maxHeight: "calc(100vh - 2rem)" }}
      >
        {panelTitle && (
          <div className="flex items-center gap-3 px-6 justify-center shrink-0" style={{ borderColor: "#f2f0ed" }}>
            <button onClick={() => onSelect("")} className="lg:hidden p-1 -ml-1 rounded-full hover:bg-[#f2f0ed]">
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-lg lg:text-xl bold" style={{ color: "var(--color-ink)" }}>{panelTitle}</h3>
          </div>
        )}
        <div className=" px-6 py-6 w-full overflow-y-auto">
          {activeKey ? children : (
            <div className="hidden lg:flex h-full items-center justify-center text-xs" style={{ color: "#a3a6af" }}>
              Select a setting from the list to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}