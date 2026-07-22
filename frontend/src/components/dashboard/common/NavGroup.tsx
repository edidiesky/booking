import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import type { NavGroup } from "@/types/ui";

interface Props {
  group: NavGroup;
}

function PulseIcon({
  Icon,
  isHovered,
}: {
  Icon: React.ElementType;
  isHovered: boolean;
}) {
  return (
    <motion.div
      animate={{
        y: isHovered ? [0, -8, 0, -8, 0] : 0,
        rotate: isHovered ? [0, -20, 20, -20, 0] : 0,
      }}
      transition={{ duration: 0.4 }}
      className="shrink-0"
    >
      <Icon size={15}  />
    </motion.div>
  );
}

export default function NavGroupComponent({ group }: Props) {
  const base = "/dashboard";
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  return (
    <div className="mb-5">
      <p
        className="text-xs uppercase tracking-widest px-2 mb-1.5 font-semibold"
        style={{ color: "var(--color-hint-of-grey)" }}
      >
        {group.label}
      </p>
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
            onMouseEnter={() => setHoveredPath(to)}
            onMouseLeave={() => setHoveredPath(null)}
            className={({ isActive }) =>
              [
                "flex items-center gap-2.5 text-[#9e9e9e] px-2.5 py-2 rounded-[8px] font-semibold text-xs transition-colors w-full mb-0.5",
                isActive ? "bg-[#f5f5f3] font-medium" : "hover:bg-[#f5f5f3]",
              ].join(" ")
            }
            style={({ isActive }) => ({
              color: isActive ? "#292929" : "#9e9e9e",
            })}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2.5 w-full"
            >
              <PulseIcon Icon={Icon} isHovered={isHovered} />
              {item.text}
            </motion.div>
          </NavLink>
        );
      })}
    </div>
  );
}
