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

const TICK_COUNT = 24;

function TickBar({ fillPercent, color }: { fillPercent: number | null | undefined; color: string }) {
  // fillPercent === null means "no real ratio exists for this stat",
  // rendered as a single solid accent stripe instead of a partial
  // fill, so it never implies a proportion that isn't real.
  if (fillPercent === null) {
    return (
      <div className="flex items-end gap-[2px] mt-1" style={{ height: 16 }}>
        <div className="flex-1 rounded-sm" style={{ height: "100%", backgroundColor: color, opacity: 0.25 }} />
      </div>
    );
  }

  const filledTicks = Math.round((Math.min(100, Math.max(0, Number(fillPercent))) / 100) * TICK_COUNT);
  return (
    <div className="flex items-end gap-[2px] mt-1" style={{ height: 16 }}>
      {Array.from({ length: TICK_COUNT }, (_, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{ height: "100%", backgroundColor: i < filledTicks ? color : "#e8e6e3" }}
        />
      ))}
    </div>
  );
}

export default function StatsGrid({
  totalRevenue,
  confirmedCount,
  checkedInCount,
  cancelledCount,
}: Props) {
  // Real, not fabricated: confirmed/checkedIn/cancelled are all counts
  // of the same unit (bookings), so each one's genuine share of that
  // total is meaningful data, not an invented number for the sake of
  // having a bar to draw.
  const totalBookings = confirmedCount + checkedInCount + cancelledCount || 1;
  const PEAK_AMT = 1000000

  const stats = [
    {
      id: "revenue",
      label: "Total Revenue",
      value: formatNgn(totalRevenue),
      sub: "From successful payments",
      Icon: TrendingUp,
      color: "#166534",
      bg: "#dcfce7",
      illPercent: ((totalRevenue ?? 0) / PEAK_AMT) * 100,
    },
    {
      id: "confirmed",
      label: "Confirmed Bookings",
      value: confirmedCount.toString(),
      sub: "Awaiting guest arrival",
      Icon: CalendarCheck,
      color: "#1d4ed8",
      bg: "#dbeafe",
      fillPercent: (confirmedCount / totalBookings) * 100,
    },
    {
      id: "checkedIn",
      label: "Checked In",
      value: checkedInCount.toString(),
      sub: "Currently on property",
      Icon: LogIn,
      color: "#92400e",
      bg: "#fef3c7",
      fillPercent: (checkedInCount / totalBookings) * 100,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      value: cancelledCount.toString(),
      sub: "Bookings cancelled",
      Icon: XCircle,
      color: "#991b1b",
      bg: "#fee2e2",
      fillPercent: (cancelledCount / totalBookings) * 100,
    },
  ];

  return (
    <div className="rounded-3xl border border-[var(--color-fog)] bg-[#f5f5f3] overflow-hidden px-1 pt-6 pb-1">
      <div className="w-full rounded-3xl bg-white grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-fog)]">
        {stats.map(({ id, label, value, sub, color, fillPercent }) => (
          <div
            key={id}
            className="flex h-44 items-start flex-col justify-between gap-3 px-5 py-4"
          >
            <div className="w-full flex items-center justify-between">
              <p
                className="text-[13px] uppercase medium"
                style={{ color: "var(--color-muted-stone)" }}
              >
                {label}
              </p>
              
            </div>
            <div className="w-full flex flex-col gap-2">
              <h3
                className="text-2xl mt-1 font-semibold lg:text-3xl"
                style={{ color: "var(--color-ink)" }}
              >
                {value}
              </h3>
              <TickBar fillPercent={fillPercent} color={color} />
              <p
                className="text-xs lg:text-[13px]  medium"
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