import { addDays, format, isToday } from "date-fns";

interface Props {
  windowStart: Date;
  visibleDays: number;
}

export default function GanttHeader({ windowStart, visibleDays }: Props) {
  const days = Array.from({ length: visibleDays }, (_, i) => addDays(windowStart, i));

  return (
    <div className="flex flex-1 min-w-0 sticky top-0 z-10 bg-white border-b" style={{ borderColor: "#e8e6e3" }}>
      {days.map((day) => {
        const today = isToday(day);
        return (
          <div
            key={day.toISOString()}
            className="flex-1 min-w-0 flex flex-col items-center justify-center py-1.5 border-r"
            style={{ borderColor: "#f2f0ed" }}
          >
            <span className="text-[9px] uppercase" style={{ color: "#a3a6af" }}>
              {format(day, "EEE")}
            </span>
            <span
              className="text-xs lg:text-[13px]     w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: today ? "#17191c" : "transparent",
                color: today ? "#fff" : "#17191c",
              }}
            >
              {format(day, "d")}
            </span>
          </div>
        );
      })}
    </div>
  );
}