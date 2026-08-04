import { Outlet, NavLink } from "react-router-dom";
import { LayoutGrid, Building2, Users, ShieldCheck, ScrollText } from "lucide-react";

const NAV = [
  { to: "/admin",          label: "Overview", icon: LayoutGrid, end: true },
  { to: "/admin/tenants",  label: "Sellers / Tenants", icon: Building2 },
  { to: "#",               label: "Customers / Guests", icon: Users, disabled: true },
  { to: "#",               label: "Administrators", icon: ShieldCheck, disabled: true },
  { to: "#",               label: "Audit Logs", icon: ScrollText, disabled: true },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--color-canvas)" }}>
      <aside className="w-[240px] shrink-0 border-r h-screen sticky top-0 flex flex-col py-6 px-4 gap-1" style={{ borderColor: "#e8e6e3" }}>
        <p className="text-xs bold px-2 mb-4" style={{ color: "var(--color-ink)" }}>Platform Admin</p>
        {NAV.map((item) => (
          item.disabled ? (
            <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs cursor-not-allowed opacity-40" style={{ color: "var(--color-muted-stone)" }}>
              <item.icon size={16} />
              {item.label}
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#f2f0ed" }}>Soon</span>
            </div>
          ) : (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-colors ${isActive ? "bg-[#17191c] text-white" : "hover:bg-[#f2f0ed]"}`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          )
        ))}
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}