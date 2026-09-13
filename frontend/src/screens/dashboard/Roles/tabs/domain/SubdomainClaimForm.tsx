import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { useClaimSubdomainMutation } from "@/redux/services/tenantDomainApi";
import { showToast } from "@/components/common/Toast";

const PLATFORM_DOMAIN =
  import.meta.env.VITE_PLATFORM_DOMAIN ?? "bukkings.space";

interface Props {
  currentSubdomain: string | null;
}

export default function SubdomainClaimForm({ currentSubdomain }: Props) {
  const [value, setValue] = useState(currentSubdomain ?? "");
  const [claim, { isLoading }] = useClaimSubdomainMutation();

  const handleClaim = async () => {
    if (!value.trim()) return;
    try {
      await claim(value.trim()).unwrap();
      showToast("Subdomain claimed.", "success");
    } catch {
      /* errorMiddleware */
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-lg font-semibold text-[#17191c]">
        Your storefront address
      </p>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="yourname"
          className="h-10 px-3 text-xs lg:text-sm border rounded-lg outline-none flex-1"
          style={{ borderColor: "#e8e6e3", color: "#17191c" }}
        />
        <span className="text-xs text-[#a3a6af] whitespace-nowrap">
          .{PLATFORM_DOMAIN}
        </span>
        <button
          type="button"
          onClick={handleClaim}
          disabled={
            isLoading || !value.trim() || value.trim() === currentSubdomain
          }
          className="h-10 px-4 rounded-lg text-xs lg:text-sm text-white disabled:opacity-50 flex items-center gap-2"
          style={{ backgroundColor: "var(--color-ink)" }}
        >
          {isLoading && <Loader2 size={13} className="animate-spin" />}
          {currentSubdomain ? "Update" : "Claim"}
        </button>
      </div>
      {currentSubdomain && (
        <p className="text-[11px] text-green-700 flex items-center gap-1">
          <Check size={11} /> Live at {currentSubdomain}.{PLATFORM_DOMAIN}
        </p>
      )}
    </div>
  );
}
