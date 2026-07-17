import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange }                 from "react-date-range";
import { enUS }                      from "date-fns/locale";
import type { RangeKeyDict }         from "react-date-range";

interface DateRangeValue {
  from: Date;
  to:   Date;
}

interface Props {
  nights:    number;
  name:      string;
  dateRange: DateRangeValue;
  onChange:  (range: DateRangeValue) => void;
}

const RANGE_COLOR = "#17191c";

export default function PropertyCalendar({ nights, name, dateRange, onChange }: Props) {
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
    showSelectionPreview:      true,
    moveRangeOnFirstSelection: false,
    locale:                    enUS,
  };

  return (
    <div className="flex pt-8 md:pt-12 border-t border-[#e8e6e3] flex-col w-full gap-4">
      <h3 className="text-xl md:text-3xl bold text-[#17191c]">
        {nights} night{nights !== 1 ? "s" : ""} in {name}
        <span className="block text-[#777b86] font-normal text-sm pt-1">
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