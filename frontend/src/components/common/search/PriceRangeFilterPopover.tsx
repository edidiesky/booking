import { useState, useEffect, useRef } from "react";
import { X, Wallet } from "lucide-react";

interface Props {
  min: number | null;
  max: number | null;
  onApply: (min: number | null, max: number | null) => void;
  ceiling?: number; // upper bound for the slider track, default 50M matching the reference
  label?: string;
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1000)}K`;
  return `₦${n}`;
}

export default function PriceRangeFilterPopover({ min, max, onApply, ceiling = 50_000_000, label = "Price" }: Props) {
  const [open, setOpen] = useState(false);
  const [draftMin, setDraftMin] = useState(min ?? 0);
  const [draftMax, setDraftMax] = useState(max ?? ceiling);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setDraftMin(min ?? 0); setDraftMax(max ?? ceiling); }, [min, max, open, ceiling]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const displayValue = min === null && max === null
    ? "Any"
    : `${min !== null ? fmtCompact(min) : "₦0"} - ${max !== null ? fmtCompact(max) : "Any"}`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col items-start text-left gap-2 px-4 py-2.5 rounded-full lg:rounded-none w-full lg:w-auto"
      >
        <span className="text-xs lg:text-[13px]flex items-center gap-1.5" style={{ color: "#a3a6af" }}>
          <Wallet size={18} /> {label}
        </span>
        <span className="text-xs lg:text-[13px]" style={{ color: "#17191c" }}>{displayValue}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border rounded-2xl shadow-xl z-30 p-5" style={{ borderColor: "#e8e6e3" }}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-xs lg:text-[13px]" style={{ color: "#17191c" }}>Your Budget</p>
              <p className="text-xs lg:text-[13px]mt-0.5" style={{ color: "#a3a6af" }}>Enter your ideal price range for your budget.</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-[#f2f0ed]">
              <X size={14} />
            </button>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <label className="flex-1">
              <span className="text-xs" style={{ color: "#a3a6af" }}>Min</span>
              <div className="flex items-center gap-1 border rounded-xl px-3 py-2 mt-1" style={{ borderColor: "#e8e6e3" }}>
                <span style={{ color: "#a3a6af" }}>₦</span>
                <input
                  type="number" min={0} max={draftMax}
                  value={draftMin}
                  onChange={(e) => setDraftMin(Math.min(Number(e.target.value) || 0, draftMax))}
                  className="w-full text-xs lg:text-[13px]outline-none"
                />
              </div>
            </label>
            <label className="flex-1">
              <span className="text-xs" style={{ color: "#a3a6af" }}>Max</span>
              <div className="flex items-center gap-1 border rounded-xl px-3 py-2 mt-1" style={{ borderColor: "#e8e6e3" }}>
                <span style={{ color: "#a3a6af" }}>₦</span>
                <input
                  type="number" min={draftMin} max={ceiling}
                  value={draftMax}
                  onChange={(e) => setDraftMax(Math.max(Number(e.target.value) || 0, draftMin))}
                  className="w-full text-xs lg:text-[13px]outline-none"
                  placeholder="Any"
                />
              </div>
            </label>
          </div>

          {/* Two overlaid native range inputs, not a real dual-thumb
              slider component, close enough visually for the common
              case without adding a new dependency for one control. */}
          <div className="relative h-6 mt-4">
            <input
              type="range" min={0} max={ceiling} value={draftMin}
              onChange={(e) => setDraftMin(Math.min(Number(e.target.value), draftMax))}
              className="absolute w-full accent-[#17191c]"
              style={{ pointerEvents: "auto" }}
            />
            <input
              type="range" min={0} max={ceiling} value={draftMax}
              onChange={(e) => setDraftMax(Math.max(Number(e.target.value), draftMin))}
              className="absolute w-full accent-[#17191c]"
              style={{ pointerEvents: "auto" }}
            />
          </div>
          <div className="flex justify-between text-[10px] mt-1" style={{ color: "#a3a6af" }}>
            <span>₦0</span>
            <span>{fmtCompact(ceiling)}</span>
          </div>

          <button
            onClick={() => { onApply(draftMin || null, draftMax === ceiling ? null : draftMax); setOpen(false); }}
            className="w-full h-11 rounded-full text-xs lg:text-[13px] text-white mt-4"
            style={{ backgroundColor: "#17191c" }}
          >
            Apply Filter
          </button>
        </div>
      )}
    </div>
  );
}