interface Props {
  propertyType: string;
  setPropertyType: (v: string) => void;
  minPrice?: number;
  setMinPrice: (v: number | undefined) => void;
  maxPrice?: number;
  setMaxPrice: (v: number | undefined) => void;
  guests?: number;
  setGuests: (v: number | undefined) => void;
}

const PROPERTY_TYPES = [
  { label: "All types",  value: "" },
  { label: "Shortlet",   value: "shortlet" },
  { label: "Hotel",      value: "hotel" },
  { label: "Guesthouse", value: "guesthouse" },
];

export default function SearchSidebar({
  propertyType, setPropertyType,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  guests, setGuests,
}: Props) {
  return (
    <aside className="w-full lg:w-[260px] shrink-0 lg:pr-6 lg:border-r" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex flex-col gap-8 lg:sticky lg:top-6">
        <div>
          <p className="text-sm bold mb-3" style={{ color: "#17191c" }}>Property type</p>
          <div className="flex flex-col gap-2">
            {PROPERTY_TYPES.map((t) => (
              <label key={t.value} className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: "#4c4c4c" }}>
                <input
                  type="radio"
                  name="propertyType"
                  checked={propertyType === t.value}
                  onChange={() => setPropertyType(t.value)}
                  className="accent-[#17191c]"
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm bold mb-3" style={{ color: "#17191c" }}>Price per night</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={minPrice ?? ""}
              onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full h-9 px-2.5 text-sm border rounded-lg outline-none"
              style={{ borderColor: "#e8e6e3" }}
            />
            <span style={{ color: "#a3a6af" }}>–</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={maxPrice ?? ""}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full h-9 px-2.5 text-sm border rounded-lg outline-none"
              style={{ borderColor: "#e8e6e3" }}
            />
          </div>
        </div>

        <div>
          <p className="text-sm bold mb-3" style={{ color: "#17191c" }}>Guests</p>
          <div className="flex items-center justify-between border rounded-lg px-3 h-10" style={{ borderColor: "#e8e6e3" }}>
            <button
              onClick={() => setGuests(Math.max(0, (guests ?? 0) - 1) || undefined)}
              className="w-6 h-6 rounded-full border flex items-center justify-center text-sm"
              style={{ borderColor: "#e8e6e3", color: "#17191c" }}
            >
              −
            </button>
            <span className="text-sm" style={{ color: "#17191c" }}>{guests ?? "Any"}</span>
            <button
              onClick={() => setGuests((guests ?? 0) + 1)}
              className="w-6 h-6 rounded-full border flex items-center justify-center text-sm"
              style={{ borderColor: "#e8e6e3", color: "#17191c" }}
            >
              +
            </button>
          </div>
        </div>

        {(propertyType || minPrice || maxPrice || guests) && (
          <button
            onClick={() => { setPropertyType(""); setMinPrice(undefined); setMaxPrice(undefined); setGuests(undefined); }}
            className="text-xs lg:text-[13px] underline text-left"
            style={{ color: "#777b86" }}
          >
            Clear all filters
          </button>
        )}
      </div>
    </aside>
  );
}