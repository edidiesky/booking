import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, Search, SearchX } from "lucide-react";
import NavGroup from "./NavGroup";
import type { NavGroup as NavGroupType } from "@/types/ui";

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 72;

type Props = {
  groups: NavGroupType[];
  title?: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  /** Bind Ctrl/⌘+K to search */
  hotkey?: boolean;
  className?: string;
  logoSrc?: string;
  base?: string;
};

export default function Sidebar({
  groups,
  title = "Bukking",
  collapsed = false,
  onToggle,
  onNavigate,
  hotkey = true,
  className = "",
  logoSrc,
  base = "/dashboard",
}: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const focusAfterExpand = useRef(false);

  const q = query.trim().toLowerCase();
  const visibleGroups = useMemo(
    () =>
      q
        ? groups
            .map((g) => ({
              ...g,
              items: g.items.filter((i) => i.text.toLowerCase().includes(q)),
            }))
            .filter((g) => g.items.length > 0)
        : groups,
    [groups, q],
  );

  const openSearch = () => {
    if (collapsed && onToggle) {
      focusAfterExpand.current = true;
      onToggle();
    } else {
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!collapsed && focusAfterExpand.current) {
      focusAfterExpand.current = false;
      inputRef.current?.focus();
    }
  }, [collapsed]);

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotkey, collapsed, onToggle]);

  const toggleButton = onToggle ? (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="h-6 w-6 flex items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-light-steel)] hover:bg-[var(--color-hover)]"
    >
      {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
    </button>
  ) : null;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={`hidden lg:flex flex-col shrink-0 border-r h-full py-4 px-3 overflow-hidden ${className}`}
      style={{
        backgroundColor: "var(--color-surface, #f5f7fa)",
        borderColor: "var(--color-border, #e1e5ea)",
      }}
    >
      {/* Brand + collapse */}
      <div
        className={`mb-4 shrink-0 flex items-center ${
          collapsed ? "flex-col gap-3" : "justify-between px-1"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {logoSrc && (
            <img
              src={logoSrc}
              alt="Logo"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain"
            />
          )}

          {!collapsed &&
            (typeof title === "string" ? (
              <p className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)] truncate">
                {title}
              </p>
            ) : (
              title
            ))}
        </div>
        {toggleButton}
      </div>

      {/* Search */}
      {collapsed ? (
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search"
          title="Search (⌘K)"
          className="w-full mb-3 shrink-0 h-9 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-light-steel)] hover:bg-[var(--color-hover)]"
        >
          <Search size={16} />
        </button>
      ) : (
        <div className="relative mb-4 shrink-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-hint-of-grey)] pointer-events-none"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setQuery("");
                e.currentTarget.blur();
              }
            }}
            placeholder="Search anything…"
            aria-label="Search navigation"
            className="h-9 w-full rounded-lg border bg-white pl-9 pr-12 text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-hint-of-grey)] outline-none focus:border-[var(--color-primary)]"
            style={{ borderColor: "var(--color-border)" }}
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[var(--color-hint-of-grey)] pointer-events-none">
            ⌘K
          </kbd>
        </div>
      )}

      <nav
        aria-label="Main"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain -mx-3 px-3 pb-2"
      >
        {visibleGroups.map((g) => (
          <NavGroup
            key={g.label}
            group={g}
            base={base}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
        {visibleGroups.length === 0 && (
          <div className="px-1 py-6 flex flex-col items-center text-center gap-2">
            <SearchX size={20} className="text-[var(--color-hint-of-grey)]" />
            <p className="text-sm font-medium text-[var(--color-ink)]">
              No pages match
            </p>
            <p className="text-xs text-[var(--color-light-steel)]">
              Nothing called “{query}”.
            </p>
          </div>
        )}
      </nav>
    </motion.aside>
  );
}
