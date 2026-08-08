import { useState } from "react";
import { Flag } from "lucide-react";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { showToast } from "@/components/common/Toast";
import { useGetSecurityStatusQuery, useSetCountryMutation } from "@/redux/services/securityApi";

// Illustrative country list matching the reference screenshots, swap this
// for whatever markets you actually operate in, this isn't sourced from
// any backend list, it's a static example set.
const COUNTRIES = [
  { code: "NG", name: "Nigeria",       dial: "+234" },
  { code: "GH", name: "Ghana",         dial: "+233" },
  { code: "KE", name: "Kenya",         dial: "+254" },
  { code: "UG", name: "Uganda",        dial: "+256" },
  { code: "BW", name: "Botswana",      dial: "+267" },
  { code: "RW", name: "Rwanda",        dial: "+250" },
  { code: "TZ", name: "Tanzania",      dial: "+255" },
  { code: "MW", name: "Malawi",        dial: "+265" },
  { code: "ZM", name: "Zambia",        dial: "+260" },
  { code: "ZA", name: "South Africa",  dial: "+27"  },
];

export default function ChangeLocationTab() {
  const { data, isLoading } = useGetSecurityStatusQuery();
  const [setCountry, { isLoading: saving }] = useSetCountryMutation();
  const [selected, setSelected] = useState<string | null>(null);

  if (isLoading || !data) {
    return <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />;
  }

  const current = selected ?? data.data.countryCode ?? undefined;

  const handleSave = async () => {
    if (!selected) return;
    try {
      await setCountry(selected).unwrap();
      showToast("Location updated.", "success");
    } catch { /* errorMiddleware */ }
  };

  return (
    <div className=" flex flex-col gap-4 max-w-sm" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-center gap-3">
        <Flag size={16} style={{ color: "#4c4c4c" }} />
        <p className="text-xs lg:text-[13px]" style={{ color: "var(--color-ink)" }}>Change Location</p>
      </div>

      <Select value={current} onValueChange={setSelected}>
        <SelectTrigger className="h-10 text-xs">
          <SelectValue placeholder="Search country" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.name} ({c.dial})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <button
        onClick={handleSave}
        disabled={saving || !selected || selected === data.data.countryCode}
        className="h-10 rounded-lg text-xs lg:text-[13px] disabled:opacity-50 w-fit px-5"
        style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
      >
        {saving ? "Saving..." : "Change Location"}
      </button>
    </div>
  );
}