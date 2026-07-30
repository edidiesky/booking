import { useState } from "react";
import { Search as SearchIcon, MapPin, SlidersHorizontal } from "lucide-react";
import PropertyTypeFilterPopover from "./PropertyTypeFilterPopover";
import PriceRangeFilterPopover from "./PriceRangeFilterPopover";

export interface PropertySearchValue {
  query:    string;
  location: string;
  propertyTypes: string[]; // ["any"] or a real subset
  minPrice: number | null;
  maxPrice: number | null;
}

interface Props {
  initialValue?: Partial<PropertySearchValue>;
  onSearch: (value: PropertySearchValue) => void;
  className?: string;
}

const DEFAULT_VALUE: PropertySearchValue = {
  query: "", location: "", propertyTypes: ["any"], minPrice: null, maxPrice: null,
};

export default function PropertySearchBar({ initialValue, onSearch, className = "" }: Props) {
  const [value, setValue] = useState<PropertySearchValue>({ ...DEFAULT_VALUE, ...initialValue });

  const handleSearch = () => onSearch(value);

  return (
    <div
      className={`w-full bg-white z-10 p-4 rounded-full lg:rounded-full flex flex-col gap-2 lg:flex-row items-stretch lg:items-center border shadow-lg ${className}`}
      style={{ borderColor: "#e8e6e3" }}
    >
      <div className="flex items-center gap-2 bg-[#f2f0edb7] px-4 py-3 min-w-20 rounded-full">
        <SearchIcon size={15} style={{ color: "#a3a6af" }} />
        <input
          value={value.query}
          onChange={(e) => setValue((v) => ({ ...v, query: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Homes, Shortlets,..."
          className="w-full text-xs lg:text-xs bg-transparent h-14 outline-none placeholder:text-[#a3a6af]"
        />
      </div>

      <div className="flex items-center gap-2 bg-[#f2f0edb7] px-4 py-3 min-w-20 rounded-full">
        <MapPin size={18} style={{ color: "#a3a6af" }} />
        <input
          value={value.location}
          onChange={(e) => setValue((v) => ({ ...v, location: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="e.g., Ikeja"
          className="w-full text-xs lg:text-xs bg-transparent h-14 outline-none placeholder:text-[#a3a6af]"
        />
      </div>

      <div className="bg-[#f2f0edb7] px-4 py-1 min-w-52 rounded-full">
        <PropertyTypeFilterPopover
          selected={value.propertyTypes}
          onApply={(propertyTypes) => setValue((v) => ({ ...v, propertyTypes }))}
        />
      </div>

      <div className="bg-[#f2f0edb7] px-4 py-1 min-w-52 rounded-full">
        <PriceRangeFilterPopover
          min={value.minPrice}
          max={value.maxPrice}
          onApply={(minPrice, maxPrice) => setValue((v) => ({ ...v, minPrice, maxPrice }))}
        />
      </div>

      <button
        className="hidden lg:flex items-center justify-center w-12 h-12 rounded-full m-1.5 shrink-0"
        style={{ backgroundColor: "#f2f0ed", color: "#4c4c4c" }}
        title="More filters"
      >
        <SlidersHorizontal size={15} />
      </button>

      <button
        onClick={handleSearch}
        className="flex min-w-32 items-center justify-center gap-2 h-14 lg:h-11 lg:rounded-full text-xs bold text-white shrink-0"
        style={{ backgroundColor: "var(--color-ink, #17191c)" }}
      >
        <SearchIcon size={15} />
        <span className="text-xs lg:text-xs">Search</span>
      </button>
    </div>
  );
}