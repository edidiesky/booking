import { NavLink } from "react-router-dom";
import { HEADER_NAV } from "@/config/brand";

/**
 * Centre navigation inside a grey pill; the current page is a white pill.
 * Shown from xl (1280px): below that the seven items plus the actions do
 * not fit, and the menu takes over.
 */
export default function NavPill() {
  return (
    <nav aria-label="Primary" className="hidden xl:block">
      <ul className="flex items-center gap-0.5 rounded-full bg-[var(--mk-paper)] p-1.5">
        {HEADER_NAV.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "inline-flex h-11 items-center rounded-full px-4 text-base text-[var(--mk-ink)]",
                  "transition-[background-color,box-shadow] duration-150 ease-out",
                  isActive
                    ? "bg-[var(--mk-surface)] shadow-[var(--mk-shadow-border)]"
                    : "hover:bg-white/70",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
