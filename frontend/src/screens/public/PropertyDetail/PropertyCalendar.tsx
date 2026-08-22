import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange }                 from "react-date-range";
import { enUS }                      from "date-fns/locale";
import type { RangeKeyDict }         from "react-date-range";
import { useState, useEffect }       from "react";
import { AvailabilityEvent }     from "@/hooks/useAvailabilityStream";

interface DateRangeValue {
  from: Date;
  to:   Date;
}

interface Props {
  nights:     number;
  name:       string;
  dateRange:  DateRangeValue;
  onChange:   (range: DateRangeValue) => void;
  liveEvent: AvailabilityEvent | null; 
  availabilitySnapshot: { date: string; available_count: number; is_blocked: boolean }[];

}

const RANGE_COLOR = "#17191c";

function toDateArray(checkIn: string, checkOut: string): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(checkIn);
  const end = new Date(checkOut);
  while (cursor < end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export default function PropertyCalendar({ nights, name, dateRange, onChange, liveEvent, availabilitySnapshot   }: Props) {
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);

useEffect(() => {
    const blocked = availabilitySnapshot
      .filter((slot) => slot.is_blocked || slot.available_count <= 0)
      .map((slot) => new Date(slot.date));
    setDisabledDates(blocked);
  }, [availabilitySnapshot]);

  // live delta, applied on top of the snapshot as SSE events arrive
  useEffect(() => {
    if (!liveEvent) return;
    const rangeDates = toDateArray(liveEvent.checkIn, liveEvent.checkOut);
    setDisabledDates((prev) => {
      if (liveEvent.type === "booked" || liveEvent.type === "blocked") {
        const merged = [...prev, ...rangeDates];
        return Array.from(new Map(merged.map((d) => [d.toDateString(), d])).values());
      }
      const rangeStrings = new Set(rangeDates.map((d) => d.toDateString()));
      return prev.filter((d) => !rangeStrings.has(d.toDateString()));
    });
  }, [liveEvent]);

  const ranges = [
    {
      startDate: dateRange.from,
      endDate:   dateRange.to,
      key:       "selection",
    },
  ];

  const handleSelect = (rangesByKey: RangeKeyDict) => {
    const selection = rangesByKey["selection"];
    if (selection?.startDate && selection?.endDate) {
      onChange({ from: selection.startDate, to: selection.endDate });
    }
  };

  const fromLabel = dateRange.from.toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
  const toLabel = dateRange.to.toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });

  const sharedProps = {
    rangeColors:               [RANGE_COLOR],
    ranges,
    onChange:                  handleSelect,
    showDateDisplay:           false,
    minDate:                   new Date(),
    disabledDates,
    showSelectionPreview:      true,
    moveRangeOnFirstSelection: false,
    locale:                    enUS,
  };

  return (
    <div className="flex pt-8 md:pt-12 border-t border-[#e8e6e3] bg-white flex-col w-full gap-4">
      <h3 className="text-xl md:text-xl font-semibold text-[#17191c]">
        {nights} night{nights !== 1 ? "s" : ""} in {name}
        <span className="block text-[#777b86] font-normal text-xs lg:text-[13px]     pt-1">
          {fromLabel} — {toLabel}
        </span>
      </h3>

      <div className="hidden md:block w-full border border-[#e8e6e3] rounded-xl overflow-hidden">
        <DateRange {...sharedProps} months={2} direction="horizontal" />
      </div>

      <div className="block md:hidden w-full border border-[#e8e6e3] rounded-xl overflow-hidden">
        <DateRange {...sharedProps} months={1} direction="horizontal" />
      </div>
    </div>
  );
}