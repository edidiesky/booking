import { useState, useEffect, useRef } from "react";
import { X, Home } from "lucide-react";

const PROPERTY_TYPES = [
  { value: "any",        label: "Any" },
  { value: "shortlet",   label: "Shortlets" },
  { value: "hotel",      label: "Hotel" },
  { value: "guesthouse", label: "Guesthouse" },
];

interface Props {
  selected: string[]; 
  onApply:  (selected: string[]) => void;
  label?:   string;
}

export default function PropertyTypeFilterPopover({ selected, onApply, label = "Property Type" }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(selected), [selected, open]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggle = (value: string) => {
    if (value === "any") { setDraft(["any"]); return; }
    setDraft((prev) => {
      const withoutAny = prev.filter((v) => v !== "any");
      const next = withoutAny.includes(value) ? withoutAny.filter((v) => v !== value) : [...withoutAny, value];
      return next.length === 0 ? ["any"] : next;
    });
  };

  const displayValue = selected.includes("any") || selected.length === 0
    ? "Any"
    : selected.map((v) => PROPERTY_TYPES.find((t) => t.value === v)?.label ?? v).join(", ");

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col items-start text-left gap-2 px-4 py-2.5 rounded-full lg:rounded-none w-full lg:w-auto"
      >
        <span className="text-xs lg:text-smflex items-center gap-1.5" style={{ color: "#a3a6af" }}>
          <Home size={18} /> {label}
        </span>
        <span className="text-xs lg:text-sm truncate max-w-[160px]" style={{ color: "#17191c" }}>{displayValue}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white border rounded-2xl shadow-xl z-30 p-5" style={{ borderColor: "#e8e6e3" }}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs lg:text-smlg:lg-xl bold" style={{ color: "#17191c" }}>Select Property Type</p>
              <p className="text-xs lg:text-smmt-0.5" style={{ color: "#a3a6af" }}>You can select multiple property types</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-[#f2f0ed]">
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-col mt-3">
            {PROPERTY_TYPES.map((t) => {
              const checked = draft.includes(t.value);
              return (
                <label key={t.value} className="flex items-center gap-3 py-2 cursor-pointer text-xs" style={{ color: "#17191c" }}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(t.value)} className="w-4 h-4 accent-[#17191c]" />
                  {t.label}
                </label>
              );
            })}
          </div>

          <button
            onClick={() => { onApply(draft); setOpen(false); }}
            className="w-full h-11 rounded-full text-xs lg:text-sm text-white mt-3"
            style={{ backgroundColor: "#17191c" }}
          >
            Apply Filter
          </button>
        </div>
      )}
    </div>
  );
}