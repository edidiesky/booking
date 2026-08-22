import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { useRequestOtpMutation } from "@/redux/services/securityApi";
import { showToast } from "@/components/common/Toast";
import OtpEntry from "./OtpEntry";
import type { OtpPurpose } from "@/types/api";

function Row({
  icon: Icon, label, verified, onVerify, verifying,
}: {
  icon: typeof Mail; label: string; verified: boolean;
  onVerify: () => void; verifying: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: "#f2f0ed" }}>
      <div className="flex items-center gap-3">
        <Icon size={16} style={{ color: "#4c4c4c" }} />
        <span className="text-xs lg:text-[13px]   " style={{ color: "var(--color-ink)" }}>{label}</span>
      </div>
      {verified ? (
        <span className="text-xs lg:text-[13px]     px-2.5 py-1 rounded-full" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
          Verified
        </span>
      ) : (
        <button
          onClick={onVerify}
          disabled={verifying}
          className="text-xs lg:text-[13px]     px-3 py-1.5 rounded-full disabled:opacity-50"
          style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
        >
          Verify
        </button>
      )}
    </div>
  );
}

interface Props {
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  hasPhone: boolean;
}

export default function VerificationSection({ isEmailVerified, isPhoneVerified, hasPhone }: Props) {
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
      <p className="text-xs lg:text-[13px]     uppercase mb-3" style={{ color: "#a3a6af" }}>Verification</p>
      <div className="rounded-xl border px-4" style={{ borderColor: "#e8e6e3" }}>
        <Row icon={Mail} label="Email Verification" verified={isEmailVerified}
             onVerify={() => start("email_verify")} verifying={pending === "email_verify"} />
        {hasPhone && (
          <Row icon={Phone} label="Phone Verification" verified={isPhoneVerified}
               onVerify={() => start("phone_verify")} verifying={pending === "phone_verify"} />
        )}
      </div>
      {(pending === "email_verify" || pending === "phone_verify") && (
        <OtpEntry purpose={pending} onDone={() => setPending(null)} onCancel={() => setPending(null)} />
      )}
    </section>
  );
}