import { Building2, ClipboardList, CreditCard, ShieldCheck } from "lucide-react";

const ACTIONS = [
  { id: "properties",      title: "Properties",      subtitle: "Every listing, all sellers",  Icon: Building2,     href: "/admin/properties" },
  { id: "bookings",        title: "Bookings",         subtitle: "Every reservation",           Icon: ClipboardList, href: "/admin/bookings" },
  { id: "payments",        title: "Payments",         subtitle: "Platform-wide transactions",  Icon: CreditCard,    href: "/admin/payments" },
  { id: "administrators",  title: "Administrators",   subtitle: "Manage admin accounts",       Icon: ShieldCheck,   href: "/admin/administrators" },
];

export default function AdminQuickActionsRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {ACTIONS.map(({ id, title, subtitle, Icon, href }) => (
        <a
          key={id}
          href={href}
          className="flex items-center hover:bg-[#f2f0ed5f] h-24 lg:h-24 gap-3 rounded-2xl border border-[var(--color-fog)] bg-[var(--color-canvas)] px-4 py-2 hover:border-[var(--color-ink)]/20 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[var(--color-fog)]">
            <Icon size={14} style={{ color: "var(--color-ink)" }} />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <p className="text-xs lg:text-[13px]" style={{ color: "var(--color-ink)" }}>{title}</p>
            <p className="text-xs lg:text-[13px] medium truncate" style={{ color: "var(--color-muted-stone)" }}>{subtitle}</p>
          </div>
        </a>
      ))}
    </div>
  );
}