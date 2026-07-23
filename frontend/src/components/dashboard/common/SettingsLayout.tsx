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
    <div className="w-full flex flex-col lg:flex-row relative overflow-hidden bg-white"
         style={{ borderColor: "#e8e6e3" }}>
      {/* Left: identity header + grouped nav list */}
      <div
        className={`w-full flex-1 bg-[#f5f5f364] sticky left-0 h-screen shrink-0 border-b lg:border-b-0 lg:border-r flex flex-col ${showDetailOnMobile ? "hidden lg:flex" : "flex"}`}
        style={{ borderColor: "#e8e6e3" }}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-5 border-b" style={{ borderColor: "#f2f0ed" }}>
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm bold shrink-0"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
            >
              {headerName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-sm bold truncate" style={{ color: "var(--color-ink)" }}>{headerName}</p>
              {headerSubtitle && (
                <p className="text-xs truncate" style={{ color: "#777b86" }}>{headerSubtitle}</p>
              )}
            </div>
          </div>
          {headerAction}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {groups.map((group) => (
            <div key={group.title} className="px-2 py-2">
              <p className="text-xs uppercase tracking-widest px-3 py-1.5" style={{ color: "#a3a6af" }}>
                {group.title}
              </p>
              <div className="w-full flex flex-col gap-2">
                {group.items.map((item) => {
                const Icon = item.icon;
                const active = item.key === activeKey;
                return (
                  <button
                    key={item.key}
                    onClick={() => onSelect(item.key)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors"
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

      {/* Right: detail panel */}
      <div className={`w-full lg:w-[520px] flex flex-col ${showDetailOnMobile ? "flex" : "hidden lg:flex"}`}>
        {panelTitle && (
          <div className="flex items-center gap-3 px-6 py-5 border-b" style={{ borderColor: "#f2f0ed" }}>
            <button onClick={() => onSelect("")} className="lg:hidden p-1 -ml-1 rounded-full hover:bg-[#f2f0ed]">
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-base bold" style={{ color: "var(--color-ink)" }}>{panelTitle}</h3>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-6">
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