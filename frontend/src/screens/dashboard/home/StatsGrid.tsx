import { TrendingUp, CalendarCheck, LogIn, XCircle } from "lucide-react";

interface Props {
  totalRevenue:   number;
  confirmedCount: number;
  checkedInCount: number;
  cancelledCount: number;
}

function formatNgn(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style:                 "currency",
    currency:              "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function StatsGrid({ totalRevenue, confirmedCount, checkedInCount, cancelledCount }: Props) {
  const stats = [
    {
      id:      "revenue",
      label:   "Total Revenue",
      value:   formatNgn(totalRevenue),
      sub:     "From successful payments",
      Icon:    TrendingUp,
      color:   "#166534",
      bg:      "#dcfce7",
    },
    {
      id:      "confirmed",
      label:   "Confirmed Bookings",
      value:   confirmedCount.toString(),
      sub:     "Awaiting guest arrival",
      Icon:    CalendarCheck,
      color:   "#1d4ed8",
      bg:      "#dbeafe",
    },
    {
      id:      "checkedIn",
      label:   "Checked In",
      value:   checkedInCount.toString(),
      sub:     "Currently on property",
      Icon:    LogIn,
      color:   "#92400e",
      bg:      "#fef3c7",
    },
    {
      id:      "cancelled",
      label:   "Cancelled",
      value:   cancelledCount.toString(),
      sub:     "Bookings cancelled",
      Icon:    XCircle,
      color:   "#991b1b",
      bg:      "#fee2e2",
    },
  ];

  // console.log("stats", {stats, totalRevenue})

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ id, label, value, sub, Icon, color, bg }) => (
        <div
          key={id}
          className="flex flex-col gap-3 p-5 rounded-xl border"
          style={{ borderColor: "var(--color-fog)", backgroundColor: "var(--color-canvas)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--color-muted-stone)" }}>
              {label}
            </p>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: bg }}>
              <Icon size={15} style={{ color }} />
            </div>
          </div>
          <div>
            <p className="text-2xl " style={{ color: "var(--color-ink)" }}>
              {value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-stone)" }}>
              {sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}