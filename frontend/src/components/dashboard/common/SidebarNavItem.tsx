import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  to: string;
  end?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export default function SidebarNavItem({
  icon: Icon,
  label,
  to,
  end = false,
  collapsed = false,
  onNavigate,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          "relative flex items-center h-9 rounded-lg transition-colors duration-150",
          collapsed ? "justify-center px-0" : "px-3",
          isActive
            ? "bg-[var(--color-secondary,#001325)] text-white"
            : "text-[var(--color-muted-stone,#334c64)] hover:bg-[var(--color-hover,#edf1f5)]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <motion.div
          whileTap={{ scale: 0.96 }}
          className={`flex items-center gap-2.5 min-w-0 ${collapsed ? "" : "w-full"}`}
          aria-current={isActive ? "page" : undefined}
        >
          <motion.div
            className="w-4 h-4 flex items-center justify-center shrink-0"
            animate={{ scale: isHovered ? [1, 1.25, 1] : 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <Icon size={16} />
          </motion.div>
          {!collapsed && (
            <span className="font-medium tracking-tight text-[13px] truncate">
              {label}
            </span>
          )}
        </motion.div>
      )}
    </NavLink>
  );
}