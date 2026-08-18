import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";

export interface SearchSelectOption {
  value: string;
  label: string;
}

interface Props {
  placeholder:  string;
  options:      SearchSelectOption[];
  value:        string | null; // null = "all" / unset
  onChange:     (value: string | null) => void;
  allLabel:     string;
}

export default function SearchSelectDropdown({ placeholder, options, value, onChange, allLabel }: Props) {
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

  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );

  const selectedLabel = value ? options.find((o) => o.value === value)?.label : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-9 px-3 rounded-lg text-xs lg:text-[13px] flex items-center gap-1.5 border transition-colors hover:bg-[#fafaf9]"
        style={{ borderColor: "#e8e6e3", color: selectedLabel ? "#17191c" : "#777b86" }}
      >
        <Search size={12} style={{ color: "#a3a6af" }} />
        {selectedLabel ?? placeholder}
        <ChevronDown size={12} style={{ color: "#a3a6af" }} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 z-30 bg-white border rounded-xl shadow-lg flex flex-col"
          style={{ borderColor: "#e8e6e3", minWidth: 220 }}
        >
          <div className="p-2 border-b" style={{ borderColor: "#f2f0ed" }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full h-8 px-2 text-xs lg:text-[13px] border rounded-md outline-none"
              style={{ borderColor: "#e8e6e3" }}
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            <button
              onClick={() => { onChange(null); setOpen(false); setQuery(""); }}
              className="w-full text-left text-xs lg:text-[13px]px-3 py-2 hover:bg-[#f2f0ed]"
              style={{ color: value === null ? "#17191c" : "#777b86", fontWeight: value === null ? 700 : 400 }}
            >
              {allLabel}
            </button>
            {filtered.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); setQuery(""); }}
                className="w-full text-left text-xs lg:text-[13px]px-3 py-2 hover:bg-[#f2f0ed] truncate"
                style={{ color: value === opt.value ? "#17191c" : "#4c4c4c", fontWeight: value === opt.value ? 700 : 400 }}
              >
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs lg:text-[13px]px-3 py-2" style={{ color: "#a3a6af" }}>No matches.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}