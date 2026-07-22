
import { useState } from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  label: string;
  to: string;
}

export default function SidebarNavItem({ icon: Icon, label, to }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <NavLink
      to={to}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={({ isActive }) =>
        `relative flex items-center h-9 px-3 rounded-full transition-colors duration-150 ${
          isActive ? "bg-[#17191c] text-white" : "text-[#4c4c4c] hover:bg-[#f2f0ed]"
        }`
      }
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-2.5 w-full"
      >
        <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
          <motion.div
            animate={{ scale: isHovered ? [1, 1.25, 1] : 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <Icon size={16} />
          </motion.div>
        </div>
        <span className="font-medium tracking-tight text-[13px]">{label}</span>
      </motion.div>
    </NavLink>
  );
}