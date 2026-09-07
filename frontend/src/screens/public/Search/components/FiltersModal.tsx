import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  KeyRound,
  Bath,
  Tv,
  Snowflake,
  Car,
  Wifi,
  WashingMachine,
  CookingPot,
  Waves,
} from "lucide-react";

export type PlaceType = "any" | "room" | "entire";

export interface SearchFiltersState {
  placeType: PlaceType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  amenities: string[];
  neighborhoods: string[];
}

const AMENITIES: { id: string; label: string; icon: React.ReactNode }[] = [
  { id: "parking", label: "Free parking", icon: <Car size={18} /> },
  { id: "wifi", label: "Wifi", icon: <Wifi size={18} /> },
  { id: "washer", label: "Washer", icon: <WashingMachine size={18} /> },
  { id: "kitchen", label: "Kitchen", icon: <CookingPot size={18} /> },
  { id: "pool", label: "Pool", icon: <Waves size={18} /> },
  { id: "ac", label: "Air conditioning", icon: <Snowflake size={18} /> },
  { id: "tv", label: "TV", icon: <Tv size={18} /> },
  { id: "self_checkin", label: "Self check-in", icon: <KeyRound size={18} /> },
  { id: "bathroom", label: "1+ bathrooms", icon: <Bath size={18} /> },
];

const RECOMMENDED = ["self_checkin", "bathroom", "tv", "ac"];

interface Props {
  open: boolean;
  onClose: () => void;
  value: SearchFiltersState;
  onApply: (next: SearchFiltersState) => void;
  resultCount?: number;
  neighborhoods?: string[];
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  const display =
    value == null || value === 0 ? "Any" : value >= 8 ? "8+" : String(value);
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[15px] text-[#222]">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!value}
          onClick={() => onChange(value && value > 1 ? value - 1 : undefined)}
          className="w-8 h-8 rounded-full border border-[#ddd] flex items-center justify-center text-[#222] disabled:opacity-30"
        >
          −
        </button>
        <span className="w-10 text-center text-[14px] text-[#222]">{display}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(8, (value ?? 0) + 1))}
          className="w-8 h-8 rounded-full border border-[#ddd] flex items-center justify-center text-[#222]"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function FiltersModal({
  open,
  onClose,
  value,
  onApply,
  resultCount,
  neighborhoods = ["East Legon", "Cantonments", "Osu", "Airport Residential"],
}: Props) {
  const [draft, setDraft] = useState<SearchFiltersState>(value);

  const toggleAmenity = (id: string) => {
    setDraft((d) => ({
      ...d,
      amenities: d.amenities.includes(id)
        ? d.amenities.filter((a) => a !== id)
        : [...d.amenities, id],
    }));
  };

  const toggleNeighborhood = (n: string) => {
    setDraft((d) => ({
      ...d,
      neighborhoods: d.neighborhoods.includes(n)
        ? d.neighborhoods.filter((x) => x !== n)
        : [...d.neighborhoods, n],
    }));
  };

  const clearAll = () => {
    setDraft({
      placeType: "any",
      minPrice: undefined,
      maxPrice: undefined,
      bedrooms: undefined,
      beds: undefined,
      bathrooms: undefined,
      amenities: [],
      neighborhoods: [],
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10060] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative bg-white w-full max-w-[560px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-center relative px-4 py-4 border-b border-[#ebebeb]">
              <button
                type="button"
                onClick={onClose}
                className="absolute left-4 w-8 h-8 rounded-full hover:bg-[#f7f7f7] flex items-center justify-center"
              >
                <X size={16} />
              </button>
              <h2 className="text-[16px] font-semibold text-[#222]">Filters</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
              {(draft.amenities.length > 0 || draft.placeType !== "any") && (
                <section>
                  <h3 className="text-[16px] font-semibold text-[#222] mb-3">
                    Selected
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {draft.amenities.map((id) => {
                      const a = AMENITIES.find((x) => x.id === id);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggleAmenity(id)}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-[#222] text-[13px]"
                        >
                          {a?.label ?? id}
                          <X size={12} />
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-[16px] font-semibold text-[#222] mb-3">
                  Recommended for you
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {RECOMMENDED.map((id) => {
                    const a = AMENITIES.find((x) => x.id === id)!;
                    const on = draft.amenities.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleAmenity(id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-[12px] text-center transition-colors ${
                          on
                            ? "border-[#222] bg-[#f7f7f7]"
                            : "border-[#ddd] hover:border-[#222]"
                        }`}
                      >
                        {a.icon}
                        <span className="leading-tight">{a.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-[16px] font-semibold text-[#222] mb-3">
                  Type of place
                </h3>
                <div className="flex rounded-xl border border-[#ddd] overflow-hidden">
                  {(
                    [
                      ["any", "Any type"],
                      ["room", "Room"],
                      ["entire", "Entire home"],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({ ...d, placeType: key }))
                      }
                      className={`flex-1 py-3 text-[14px] border-r border-[#ddd] last:border-0 ${
                        draft.placeType === key
                          ? "bg-[#f7f7f7] font-semibold text-[#222]"
                          : "text-[#222] hover:bg-[#fafafa]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[16px] font-semibold text-[#222]">
                  Price range
                </h3>
                <p className="text-[13px] text-[#717171] mb-4">
                  Trip price, includes all fees
                </p>
                <div className="h-16 mb-4 flex items-end gap-0.5 px-1">
                  {Array.from({ length: 40 }).map((_, i) => {
                    const h =
                      20 + Math.sin(i / 3) * 18 + (i > 10 && i < 28 ? 25 : 0);
                    const inRange =
                      (draft.minPrice ?? 0) / 500 <= i / 40 &&
                      i / 40 <= (draft.maxPrice ?? 500) / 500;
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          background: inRange ? "#e31c5f" : "#ddd",
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex-1 border border-[#ddd] rounded-xl px-3 py-2">
                    <span className="block text-[11px] text-[#717171]">
                      Minimum
                    </span>
                    <input
                      type="number"
                      min={0}
                      placeholder="$0"
                      value={draft.minPrice ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          minPrice: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        }))
                      }
                      className="w-full text-[14px] outline-none"
                    />
                  </label>
                  <span className="text-[#717171]">–</span>
                  <label className="flex-1 border border-[#ddd] rounded-xl px-3 py-2">
                    <span className="block text-[11px] text-[#717171]">
                      Maximum
                    </span>
                    <input
                      type="number"
                      min={0}
                      placeholder="$500+"
                      value={draft.maxPrice ?? ""}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          maxPrice: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        }))
                      }
                      className="w-full text-[14px] outline-none"
                    />
                  </label>
                </div>
              </section>

              <section>
                <h3 className="text-[16px] font-semibold text-[#222] mb-1">
                  Rooms and beds
                </h3>
                <Stepper
                  label="Bedrooms"
                  value={draft.bedrooms}
                  onChange={(v) => setDraft((d) => ({ ...d, bedrooms: v }))}
                />
                <Stepper
                  label="Beds"
                  value={draft.beds}
                  onChange={(v) => setDraft((d) => ({ ...d, beds: v }))}
                />
                <Stepper
                  label="Bathrooms"
                  value={draft.bathrooms}
                  onChange={(v) => setDraft((d) => ({ ...d, bathrooms: v }))}
                />
              </section>

              <section>
                <h3 className="text-[16px] font-semibold text-[#222] mb-3">
                  Amenities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((a) => {
                    const on = draft.amenities.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAmenity(a.id)}
                        className={`inline-flex items-center gap-2 h-10 px-4 rounded-full border text-[13px] ${
                          on
                            ? "border-[#222] bg-[#f7f7f7] font-medium"
                            : "border-[#ddd] hover:border-[#222]"
                        }`}
                      >
                        {a.icon}
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="text-[16px] font-semibold text-[#222] mb-3">
                  Popular neighborhoods
                </h3>
                <div className="flex flex-wrap gap-2">
                  {neighborhoods.map((n) => {
                    const on = draft.neighborhoods.includes(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => toggleNeighborhood(n)}
                        className={`h-10 px-4 rounded-full border text-[13px] ${
                          on
                            ? "border-[#222] bg-[#f7f7f7] font-medium"
                            : "border-[#ddd] hover:border-[#222]"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[#ebebeb]">
              <button
                type="button"
                onClick={clearAll}
                className="text-[14px] font-semibold underline text-[#222]"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(draft);
                  onClose();
                }}
                className="h-12 px-6 rounded-lg bg-[#222] text-white text-[15px] font-semibold hover:bg-black transition-colors"
              >
                {resultCount != null
                  ? `Show ${resultCount.toLocaleString()}+ places`
                  : "Show places"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}