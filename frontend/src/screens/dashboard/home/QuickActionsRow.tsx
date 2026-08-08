import { Building2, BedDouble, CalendarCheck, CreditCard } from "lucide-react";

const ACTIONS = [
  { id: "add-property",  title: "Add property",  subtitle: "Register a new property",     Icon: Building2,     href: "/dashboard/properties" },
  { id: "add-room-type", title: "Add room type", subtitle: "Create a new room/unit type",  Icon: BedDouble,     href: "/dashboard/room-types" },
  { id: "view-bookings", title: "View bookings", subtitle: "See all reservations",         Icon: CalendarCheck, href: "/dashboard/bookings" },
  { id: "view-payments", title: "View payments", subtitle: "Track transactions",           Icon: CreditCard,    href: "/dashboard/payments" },
];

export default function QuickActionsRow() {
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