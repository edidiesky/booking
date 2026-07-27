import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface MultiSelectOption {
  value: string;
  label: string;
  color?: string;
}

interface Props {
  label:      string;
  options:    MultiSelectOption[];
  selected:   Set<string>;
  onToggle:   (value: string) => void;
  onSelectAll?: () => void;
  icon?:      React.ReactNode;
  searchable?: boolean;
}

export default function MultiSelectDropdown({ label, options, selected, onToggle, onSelectAll, icon, searchable = false }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const activeCount = selected.size;
  const allSelected = activeCount === options.length;
  const visibleOptions = searchable && query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-9 px-3 rounded-lg text-xs flex items-center gap-1.5 border transition-colors hover:bg-[#fafaf9]"
        style={{ borderColor: "#e8e6e3", color: "#17191c" }}
      >
        {icon}
        {label}
        {!allSelected && (
          <span className="text-[10px] bold px-1.5 rounded-full" style={{ backgroundColor: "#f2f0ed", color: "#17191c" }}>
            {activeCount}/{options.length}
          </span>
        )}
        <ChevronDown size={12} style={{ color: "#a3a6af" }} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 z-30 bg-white border rounded-xl shadow-lg py-1.5 flex flex-col max-h-72 overflow-y-auto"
          style={{ borderColor: "#e8e6e3", minWidth: 200 }}
        >
          {searchable && options.length > 2 && (
            <div className="px-2 pb-1.5 sticky top-0 bg-white">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#a3a6af" }} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search room types..."
                  className="w-full h-8 pl-7 pr-2 text-xs rounded-lg border outline-none"
                  style={{ borderColor: "#e8e6e3" }}
                />
              </div>
            </div>
          )}
          {visibleOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-xs px-3 py-2 hover:bg-[#f2f0ed] cursor-pointer"
              style={{ color: "#17191c" }}
            >
              <input type="checkbox" checked={selected.has(opt.value)} onChange={() => onToggle(opt.value)} />
              {opt.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />}
              {opt.label}
            </label>
          ))}
          {visibleOptions.length === 0 && (
            <p className="text-xs px-3 py-2" style={{ color: "#a3a6af" }}>
              {options.length === 0 ? "Nothing to filter yet." : "No matches."}
            </p>
          )}
          {onSelectAll && options.length > 0 && (
            <>
              <div className="border-t my-1" style={{ borderColor: "#f2f0ed" }} />
              <button
                onClick={onSelectAll}
                className="text-xs text-left px-3 py-1.5 hover:bg-[#f2f0ed]"
                style={{ color: "#777b86" }}
              >
                {allSelected ? "Clear all" : "Check all"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}