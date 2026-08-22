import { Search } from "lucide-react";
import type { ReactNode } from "react";

interface FilterBarProps {
  children: ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
  return <div className="flex items-center gap-2 flex-wrap">{children}</div>;
}

interface SearchInputProps {
  value:       string;
  onChange:    (v: string) => void;
  placeholder?: string;
}

export function FilterSearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
  return (
    <div className="relative">
      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#a3a6af" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 pl-8 pr-3 text-xs lg:text-[13px]     border rounded-lg outline-none w-48"
        style={{ borderColor: "#e8e6e3", color: "#17191c" }}
      />
    </div>
  );
}