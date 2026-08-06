import type { ReactNode } from "react";

export interface RankedListItem {
  id:        string;
  image?:    string;
  icon?:     ReactNode;
  title:     string;
  subtitle?: string;
  value?:    string;
  badge?:    { label: string; color: string; bg: string };
  onClick?:  () => void;
}

interface Props {
  title: string;
  icon?: ReactNode;
  items: RankedListItem[];
  emptyLabel?: string;
}

export default function RankedListCard({ title, icon, items, emptyLabel = "Nothing to show yet." }: Props) {
  return (
    <div className="border rounded-xl p-4" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <p className="text-xs lg:text-sm" style={{ color: "#17191c" }}>{title}</p>
      </div>

      {items.length === 0 ? (
        <p className="text-xs lg:text-smpy-8 text-center" style={{ color: "#a3a6af" }}>{emptyLabel}</p>
      ) : (
        <div className="flex flex-col">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              disabled={!item.onClick}
              className="flex items-center gap-3 py-2.5 border-b last:border-0 text-left disabled:cursor-default hover:bg-[#fafaf9] transition-colors -mx-2 px-2 rounded"
              style={{ borderColor: "#f2f0ed" }}
            >
              {item.image ? (
                <img src={item.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
              ) : item.icon ? (
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#f2f0ed" }}>
                  {item.icon}
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <p className="text-xs lg:text-sm truncate" style={{ color: "#17191c" }}>{item.title}</p>
                {item.subtitle && <p className="text-[11px] truncate" style={{ color: "#a3a6af" }}>{item.subtitle}</p>}
              </div>

              {item.badge && (
                <span className="text-[10px] bold px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: item.badge.bg, color: item.badge.color }}>
                  {item.badge.label}
                </span>
              )}
              {item.value && <span className="text-xs lg:text-sm shrink-0" style={{ color: "#17191c" }}>{item.value}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}