import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useRequestOtpMutation } from "@/redux/services/securityApi";
import { showToast } from "@/components/common/Toast";
import OtpEntry from "./OtpEntry";
import type { OtpPurpose } from "@/types/api";

interface Props {
  enabled: boolean;
}

export default function TwoFactorSection({ enabled }: Props) {
  const [requestOtp] = useRequestOtpMutation();
  const [pending, setPending] = useState<OtpPurpose | null>(null);

  const start = async (purpose: OtpPurpose) => {
    try {
      await requestOtp(purpose).unwrap();
      showToast("Verification code sent.", "success");
      setPending(purpose);
    } catch { /* errorMiddleware */ }
  };

  return (
    <section>
      <p className="text-xs lg:text-sm uppercase mb-3" style={{ color: "#a3a6af" }}>Two-Factor Authentication</p>
      <div className="rounded-xl border p-4 flex items-center justify-between" style={{ borderColor: "#e8e6e3" }}>
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} style={{ color: "#4c4c4c" }} />
          <div>
            <p className="text-xs lg:text-sm" style={{ color: "var(--color-ink)" }}>
              {enabled ? "2FA is on" : "2FA is off"}
            </p>
            <p className="text-xs lg:text-smmt-0.5" style={{ color: "#777b86" }}>
              Each time you perform a sensitive action, you'll need to authenticate with a code.
            </p>
          </div>
        </div>
        <button
          onClick={() => start(enabled ? "two_factor_disable" : "two_factor_enable")}
          className="text-xs lg:text-sm px-3 py-1.5 rounded-full shrink-0"
          style={{
            backgroundColor: enabled ? "#fee2e2" : "var(--color-ink)",
            color: enabled ? "#991b1b" : "var(--color-canvas)",
          }}
        >
          {enabled ? "Turn off" : "Turn on"}
        </button>
      </div>
      {(pending === "two_factor_enable" || pending === "two_factor_disable") && (
        <OtpEntry purpose={pending} onDone={() => setPending(null)} onCancel={() => setPending(null)} />
      )}
    </section>
  );
}