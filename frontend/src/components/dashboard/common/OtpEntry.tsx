import { useState } from "react";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/common/Toast";
import { useVerifyOtpMutation } from "@/redux/services/securityApi";
import type { OtpPurpose } from "@/types/api";

interface Props {
  purpose:  OtpPurpose;
  onDone:   () => void;
  onCancel: () => void;
}

export default function OtpEntry({ purpose, onDone, onCancel }: Props) {
  const [code, setCode] = useState("");
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();

  const handleVerify = async () => {
    try {
      await verifyOtp({ purpose, code }).unwrap();
      showToast("Verified.", "success");
      onDone();
    } catch { /* errorMiddleware */ }
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border mt-3" style={{ borderColor: "#e8e6e3", backgroundColor: "#fafaf9" }}>
      <p className="text-xs" style={{ color: "#777b86" }}>Enter the 6-digit code we sent you.</p>
      <div className="flex items-center gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className="flex-1"
        />
        <button
          onClick={handleVerify}
          disabled={code.length !== 6 || isLoading}
          className="h-10 px-4 rounded-lg text-xs lg:text-[13px] disabled:opacity-50"
          style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
        >
          Confirm
        </button>
        <button onClick={onCancel} className="h-10 px-3 text-xs" style={{ color: "#777b86" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}