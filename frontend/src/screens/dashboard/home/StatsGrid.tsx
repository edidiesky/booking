import { TrendingUp, CalendarCheck, LogIn, XCircle } from "lucide-react";

interface Props {
  totalRevenue: number;
  confirmedCount: number;
  checkedInCount: number;
  cancelledCount: number;
}

function formatNgn(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function StatsGrid({
  totalRevenue,
  confirmedCount,
  checkedInCount,
  cancelledCount,
}: Props) {
  const stats = [
    {
      id: "revenue",
      label: "Total Revenue",
      value: formatNgn(totalRevenue),
      sub: "From successful payments",
      Icon: TrendingUp,
      color: "#166534",
      bg: "#dcfce7",
    },
    {
      id: "confirmed",
      label: "Confirmed Bookings",
      value: confirmedCount.toString(),
      sub: "Awaiting guest arrival",
      Icon: CalendarCheck,
      color: "#1d4ed8",
      bg: "#dbeafe",
    },
    {
      id: "checkedIn",
      label: "Checked In",
      value: checkedInCount.toString(),
      sub: "Currently on property",
      Icon: LogIn,
      color: "#92400e",
      bg: "#fef3c7",
    },
    {
      id: "cancelled",
      label: "Cancelled",
      value: cancelledCount.toString(),
      sub: "Bookings cancelled",
      Icon: XCircle,
      color: "#991b1b",
      bg: "#fee2e2",
    },
  ];

  return (
    <div className="rounded-3xl border border-[var(--color-fog)] bg-[#f5f5f3] overflow-hidden px-1 pt-6 pb-1">
      <div className="w-full rounded-3xl bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-fog)]">
        {stats.map(({ id, label, value, sub }) => (
          <div
            key={id}
            className="flex h-36 lg:h-44 items-start flex-col justify-between gap-3 px-5 py-4"
          >
            <p
                className="text-xs uppercase medium"
                style={{ color: "var(--color-muted-stone)" }}
              >
                {label}
              </p>
              <div className="w-full flex flex-col gap-3">
                <h4
                  className="text-xl mt-1 bold lg:text-3xl"
                  style={{ color: "var(--color-ink)" }}
                >
                  {value}
                </h4>
                <p
                  className="text-xs medium"
                  style={{ color: "var(--color-muted-stone)" }}
                >
                  {sub}
                </p>
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}
