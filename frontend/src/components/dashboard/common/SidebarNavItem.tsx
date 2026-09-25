import { useState } from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  to: string;
  end?: boolean;
  onNavigate?: () => void;
}

export default function SidebarNavItem({
  icon: Icon,
  label,
  to,
  end,
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
      className={({ isActive }) =>
        `relative flex items-center h-9 px-3 rounded-full transition-colors duration-150 ${
          isActive ? "bg-ink text-white" : "text-muted hover:bg-hover"
        }`
      }
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-2.5 w-full min-w-0"
      >
        <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
          <motion.div
            animate={{ scale: isHovered ? [1, 1.25, 1] : 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <Icon size={16} />
          </motion.div>
        </div>
        <span className="font-medium tracking-tight text-[13px] truncate">
          {label}
        </span>
      </motion.div>
    </NavLink>
  );
}
