import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  BedDouble,
  Bath,
  Users,
  Building2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PROPERTY_TYPES } from "@/constants/amenities";

function ClickDatePicker({
  from,
  to,
  onChange,
}: {
  from: Date | null;
  to: Date | null;
  onChange: (range: { from: Date; to: Date }) => void;
}) {
  const seed = from ?? new Date();
  const [month, setMonth] = useState(() => startOfMonth(seed));
  const [picking, setPicking] = useState<"from" | "to">("from");

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDayClick = (day: Date) => {
    if (isBefore(day, today)) return;
    if (picking === "from" || !from) {
      onChange({ from: day, to: addDays(day, 1) });
      setPicking("to");
      return;
    }
    if (isBefore(day, from) || isSameDay(day, from)) {
      onChange({ from: day, to: addDays(day, 1) });
      setPicking("to");
      return;
    }
    onChange({ from, to: day });
    setPicking("from");
  };

  const inRange = (day: Date) => {
    if (!from || !to) return false;
    return (!isBefore(day, from) && isBefore(day, to)) || isSameDay(day, to);
  };

  return (
    <div className="w-[300px] select-none p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f3f4f6]"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-[14px] font-semibold text-[#17191c]">
          {format(month, "MMMM yyyy")}
        </p>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#f3f4f6]"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-[#a3a6af]">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const disabled = isBefore(day, today);
          const isStart = from ? isSameDay(day, from) : false;
          const isEnd = to ? isSameDay(day, to) : false;
          const isMid = inRange(day) && !isStart && !isEnd;
          const outside = !isSameMonth(day, month);
          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(day)}
              className={cn(
                "relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[13px]",
                outside && "text-[#c4c6ce]",
                disabled && "cursor-not-allowed opacity-30",
                !disabled && !isStart && !isEnd && "hover:bg-[#f3f4f6]",
                isMid && "w-full rounded-none bg-[#ecfdf5] text-[#166534]",
                (isStart || isEnd) && "bg-[#17191c] font-semibold text-white",
                isToday(day) && !isStart && !isEnd && "ring-1 ring-[#17191c]",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[11px] text-[#a3a6af]">
        {picking === "from" ? "Select check-in" : "Select check-out"}
      </p>
    </div>
  );
}

export interface SearchBarFilters {
  checkIn?: string;
  checkOut?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
}

interface Props {
  value: SearchBarFilters;
  onChange: (next: SearchBarFilters) => void;
  onApply: () => void;
  onReset: () => void;
  onOpenMoreFilters: () => void;
  activeMoreCount?: number;
}

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition-colors",
        active
          ? "border-[#17191c] bg-[#f7f7f5] font-medium text-[#17191c]"
          : "border-[#e8e6e3] bg-white text-[#444] hover:border-[#c4c6ce]",
      )}
    >
      {children}
    </button>
  );
}

export default function SearchFilterBar({
  value,
  onChange,
  onApply,
  onReset,
  onOpenMoreFilters,
  activeMoreCount = 0,
}: Props) {
  const [open, setOpen] = useState<
    null | "dates" | "price" | "guests" | "beds" | "baths" | "type"
  >(null);

  const from = value.checkIn ? new Date(value.checkIn) : null;
  const to = value.checkOut ? new Date(value.checkOut) : null;

  const dateLabel =
    from && to
      ? `${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}`
      : "Dates";

  const priceLabel =
    value.minPrice != null || value.maxPrice != null
      ? `$${value.minPrice ?? 0} – $${value.maxPrice ?? "∞"}`
      : "Price";

  return (
    <div className="sticky top-0 z-30 border-b border-[#ebebeb] bg-white">
      <div className="mx-auto flex max-w-[1760px] flex-wrap items-center gap-2 px-4 py-3 lg:px-6">
        <Chip
          active={!!(from && to)}
          onClick={() => setOpen(open === "dates" ? null : "dates")}
        >
          <CalendarDays size={15} className="text-[#777b86]" />
          {dateLabel}
        </Chip>
        <Chip
          active={value.minPrice != null || value.maxPrice != null}
          onClick={() => setOpen(open === "price" ? null : "price")}
        >
          {priceLabel}
        </Chip>
        <Chip
          active={!!value.guests}
          onClick={() => setOpen(open === "guests" ? null : "guests")}
        >
          <Users size={15} className="text-[#777b86]" />
          {value.guests
            ? `${value.guests} Guest${value.guests > 1 ? "s" : ""}`
            : "Guests"}
        </Chip>
        <Chip
          active={!!value.bedrooms}
          onClick={() => setOpen(open === "beds" ? null : "beds")}
        >
          <BedDouble size={15} className="text-[#777b86]" />
          {value.bedrooms ? `${value.bedrooms} Bed` : "Beds"}
        </Chip>
        <Chip
          active={!!value.bathrooms}
          onClick={() => setOpen(open === "baths" ? null : "baths")}
        >
          <Bath size={15} className="text-[#777b86]" />
          {value.bathrooms ? `${value.bathrooms}+ Bath` : "Baths"}
        </Chip>
        <Chip
          active={!!value.propertyType}
          onClick={() => setOpen(open === "type" ? null : "type")}
        >
          <Building2 size={15} className="text-[#777b86]" />
          {value.propertyType
            ? (PROPERTY_TYPES.find((p) => p.value === value.propertyType)
                ?.label ?? value.propertyType)
            : "Type"}
        </Chip>
        <button
          type="button"
          onClick={onOpenMoreFilters}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-[#e8e6e3] px-3.5 text-[13px] hover:border-[#c4c6ce]"
        >
          More filters
          {activeMoreCount > 0 && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#17191c] px-1 text-[10px] font-semibold text-white">
              {activeMoreCount}
            </span>
          )}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onReset();
              setOpen(null);
            }}
            className="h-10 rounded-full border border-[#e8e6e3] px-4 text-[13px] text-[#777b86] hover:border-[#c4c6ce] hover:text-[#17191c]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              onApply();
              setOpen(null);
            }}
            className="h-10 rounded-full bg-[#17191c] px-5 text-[13px] font-semibold text-white hover:bg-black"
          >
            Apply
          </button>
        </div>
      </div>

      {open && (
        <div className="relative mx-auto max-w-[1760px] px-4 lg:px-6">
          <div className="absolute left-4 top-0 z-40 rounded-2xl border border-[#e8e6e3] bg-white shadow-xl lg:left-6">
            {open === "dates" && (
              <div>
                <div className="flex items-center justify-between border-b border-[#ebebeb] px-3 py-2">
                  <p className="text-[13px] font-semibold text-[#17191c]">
                    Stay dates
                  </p>
                  <button type="button" onClick={() => setOpen(null)}>
                    <X size={16} className="text-[#777b86]" />
                  </button>
                </div>
                <ClickDatePicker
                  from={from}
                  to={to}
                  onChange={({ from: f, to: t }) =>
                    onChange({
                      ...value,
                      checkIn: f.toISOString().slice(0, 10),
                      checkOut: t.toISOString().slice(0, 10),
                    })
                  }
                />
              </div>
            )}
            {open === "price" && (
              <div className="w-[280px] space-y-3 p-4">
                <p className="text-[13px] font-semibold text-[#17191c]">
                  Price per night
                </p>
                <div className="flex items-center gap-2">
                  <label className="flex-1 rounded-xl border border-[#e8e6e3] px-3 py-2">
                    <span className="block text-[10px] text-[#a3a6af]">
                      Min
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={value.minPrice ?? ""}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          minPrice: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full text-[14px] outline-none"
                      placeholder="0"
                    />
                  </label>
                  <span className="text-[#a3a6af]">–</span>
                  <label className="flex-1 rounded-xl border border-[#e8e6e3] px-3 py-2">
                    <span className="block text-[10px] text-[#a3a6af]">
                      Max
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={value.maxPrice ?? ""}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          maxPrice: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full text-[14px] outline-none"
                      placeholder="Any"
                    />
                  </label>
                </div>
              </div>
            )}
            {(open === "guests" || open === "beds" || open === "baths") && (
              <div className="w-[240px] p-4">
                {(
                  [
                    ["guests", "Guests", value.guests],
                    ["beds", "Bedrooms", value.bedrooms],
                    ["baths", "Bathrooms", value.bathrooms],
                  ] as const
                )
                  .filter(([k]) => k === open)
                  .map(([key, label, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-[14px] text-[#17191c]">
                        {label}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ddd]"
                          onClick={() => {
                            const next =
                              Math.max(0, (val ?? 0) - 1) || undefined;
                            if (key === "guests")
                              onChange({ ...value, guests: next });
                            if (key === "beds")
                              onChange({ ...value, bedrooms: next });
                            if (key === "baths")
                              onChange({ ...value, bathrooms: next });
                          }}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-[14px]">
                          {val ?? "Any"}
                        </span>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ddd]"
                          onClick={() => {
                            const next = (val ?? 0) + 1;
                            if (key === "guests")
                              onChange({ ...value, guests: next });
                            if (key === "beds")
                              onChange({ ...value, bedrooms: next });
                            if (key === "baths")
                              onChange({ ...value, bathrooms: next });
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {open === "type" && (
              <div className="w-[220px] p-2">
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...value, propertyType: undefined })
                  }
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left text-[13px]",
                    !value.propertyType
                      ? "bg-[#f3f4f6] font-semibold"
                      : "hover:bg-[#fafaf9]",
                  )}
                >
                  Any type
                </button>
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() =>
                      onChange({ ...value, propertyType: t.value })
                    }
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 text-left text-[13px] capitalize",
                      value.propertyType === t.value
                        ? "bg-[#f3f4f6] font-semibold"
                        : "hover:bg-[#fafaf9]",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
