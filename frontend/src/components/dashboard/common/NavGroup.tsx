import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import type { NavGroup as NavGroupType } from "@/types/ui";

interface Props {
  group: NavGroupType;
  base?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export default function NavGroup({
  group,
  base = "/dashboard",
  collapsed = false,
  onNavigate,
}: Props) {
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  return (
    <div className="mb-5">
      {!collapsed && (
        <p className="text-[11px] uppercase px-2 mb-1.5 font-semibold tracking-wide text-[var(--color-hint-of-grey)]">
          {group.label}
        </p>
      )}
      <div className="flex flex-col gap-1 w-full">
        {group.items.map((item) => {
        const Icon = item.icon;
        const to = item.path ? `${base}/${item.path}` : base;
        const isHovered = hoveredPath === to;

        return (
          <NavLink
            key={to}
            to={to}
            end={!item.path}
            data-tour={item.tour}
            title={collapsed ? item.text : undefined}
            onClick={() => onNavigate?.()}
            onMouseEnter={() => setHoveredPath(to)}
            onMouseLeave={() => setHoveredPath(null)}
            className={({ isActive }) =>
              [
                "flex items-center gap-2.5 px-2.5 py-1.5 text-[var(--color-ink)] rounded-full text-[13px] font-semibold transition-colors w-full",
                collapsed ? "justify-center" : "",
                isActive
                  ? "bg-[var(--color-primary)] text-[var(--color-canvas)]"
                  : " hover:bg-[var(--color-canvas)]",
              ].join(" ")
            }
          >
            <motion.div
              animate={
                isHovered && !collapsed
                  ? { y: [0, -4, 0] }
                  : { y: 0 }
              }
              transition={{ duration: 0.35 }}
              className="shrink-0"
            >
              <Icon size={15} />
            </motion.div>
            {!collapsed && <span className="truncate">{item.text}</span>}
          </NavLink>
        );
      })}
      </div>
    </div>
  );
}