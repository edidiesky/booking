import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  useAddCustomDomainMutation,
  useVerifyCustomDomainMutation,
  useRemoveCustomDomainMutation,
} from "@/redux/services/tenantDomainApi";
import { showToast } from "@/components/common/Toast";
import DomainDnsInstructions from "./DomainDnsInstructions";
import type { TenantDomainInfo } from "@/redux/services/tenantDomainApi";

interface Props {
  info: TenantDomainInfo;
}

const STATUS_LABEL: Record<TenantDomainInfo["customDomainStatus"], string> = {
  none: "",
  pending: "Pending verification",
  verified: "Verified",
  failed: "DNS check failed, retry once records propagate",
};

export default function CustomDomainSection({ info }: Props) {
  const [domain, setDomain] = useState("");
  const [addDomain, { isLoading: adding }] = useAddCustomDomainMutation();
  const [verify, { isLoading: verifying }] = useVerifyCustomDomainMutation();
  const [remove, { isLoading: removing }] = useRemoveCustomDomainMutation();

  const handleAdd = async () => {
    if (!domain.trim()) return;
    try {
      await addDomain(domain.trim()).unwrap();
      setDomain("");
      showToast(
        "Domain added, add the DNS records below then verify.",
        "success",
      );
    } catch {
      /* errorMiddleware */
    }
  };

  const handleVerify = async () => {
    try {
      await verify().unwrap();
      showToast("Domain verified and live.", "success");
    } catch {
      /* errorMiddleware surfaces the real backend message */
    }
  };

  const handleRemove = async () => {
    try {
      await remove().unwrap();
      showToast("Custom domain removed.", "success");
    } catch {
      /* errorMiddleware */
    }
  };

  return (
    <div
      className="flex flex-col gap-3 pt-4 border-t"
      style={{ borderColor: "#f2f0ed" }}
    >
      <p className="text-xs lg:text-[13px] font-semibold text-[#17191c]">
        Custom domain
      </p>

      {!info.customDomain ? (
        <div className="flex items-center gap-2">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="yourstore.com"
            className="h-10 px-3 text-xs lg:text-[13px] border rounded-lg outline-none flex-1"
            style={{ borderColor: "#e8e6e3", color: "#17191c" }}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !domain.trim()}
            className="h-10 px-4 rounded-lg text-xs lg:text-[13px] text-white disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: "var(--color-ink)" }}
          >
            {adding && <Loader2 size={13} className="animate-spin" />}
            Add domain
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-[13px] text-[#17191c]">
                {info.customDomain}
              </p>
              <p
                className={`text-[11px] ${info.customDomainStatus === "verified" ? "text-green-700" : "text-[#a3a6af]"}`}
              >
                {STATUS_LABEL[info.customDomainStatus]}
              </p>
            </div>
            <div className="flex gap-2">
              {info.customDomainStatus !== "verified" && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="h-9 px-3 rounded-lg text-xs border disabled:opacity-50"
                  style={{ borderColor: "#e8e6e3", color: "#17191c" }}
                >
                  {verifying ? "Checking..." : "Verify now"}
                </button>
              )}
              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="h-9 px-3 rounded-lg text-xs text-red-600 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>

          {info.customDomainStatus !== "verified" && (
            <DomainDnsInstructions
              domain={info.customDomain}
              token={info.customDomainVerificationToken}
            />
          )}
        </>
      )}
    </div>
  );
}
