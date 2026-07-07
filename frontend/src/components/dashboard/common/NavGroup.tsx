import { NavLink }       from "react-router-dom";
import type { NavGroup } from "@/types/ui";

interface Props { group: NavGroup; }

export default function NavGroupComponent({ group }: Props) {
  const base = "/dashboard";

  return (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-widest px-2 mb-1.5 bold"
         style={{ color: "var(--color-hint-of-grey)" }}>
        {group.label}
      </p>
      {group.items.map((item) => {
        const Icon = item.icon;
        const to   = item.path ? `${base}/${item.path}` : base;
        return (
          <NavLink
            key={to}
            to={to}
            end={!item.path}
            data-tour={item.tour}
            className={({ isActive }) =>
              [
                "flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] bold text-base transition-colors w-full mb-0.5",
                isActive
                  ? "bg-[#f5f5f3] font-medium"
                  : "hover:bg-[#f5f5f3]",
              ].join(" ")
            }
            style={({ isActive }) => ({ color: isActive ? "var(--color-ink)" : "var(--color-muted-stone)" })}
          >
            <Icon size={15} className="shrink-0" />
            {item.text}
          </NavLink>
        );
      })}
    </div>
  );
}