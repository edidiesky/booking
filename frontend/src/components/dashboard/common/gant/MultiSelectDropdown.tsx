import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
  color?: string;
}

interface Props {
  label:     string;
  options:   Option[];
  selected:  Set<string>;
  onToggle:  (value: string) => void;
}

// Small reusable checkbox-in-popover dropdown, used for both the room type
// and status filters in the toolbar, kept as its own component instead of
// duplicating the popover open/close logic twice.
export default function MultiSelectDropdown({ label, options, selected, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCount = selected.size;
  const allSelected = activeCount === options.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 px-3 rounded-full text-xs flex items-center gap-1.5 border"
        style={{ borderColor: "#e8e6e3", color: "#17191c" }}
      >
        {label}
        {!allSelected && (
          <span className="text-[10px] bold px-1.5 rounded-full" style={{ backgroundColor: "#17191c", color: "#fff" }}>
            {activeCount}
          </span>
        )}
        <ChevronDown size={12} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-20 bg-white border rounded-lg shadow-lg p-2 flex flex-col gap-1 max-h-64 overflow-y-auto"
          style={{ borderColor: "#e8e6e3", minWidth: 180 }}
        >
          {options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded hover:bg-[#f2f0ed] cursor-pointer" style={{ color: "#17191c" }}>
              <input type="checkbox" checked={selected.has(opt.value)} onChange={() => onToggle(opt.value)} />
              {opt.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
              {opt.label}
            </label>
          ))}
          {options.length === 0 && (
            <p className="text-xs px-2 py-1.5" style={{ color: "#a3a6af" }}>Nothing to filter yet.</p>
          )}
        </div>
      )}
    </div>
  );
}