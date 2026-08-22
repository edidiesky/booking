import { useState } from "react";
import { ShieldCheck, KeyRound, Mail, Phone } from "lucide-react";
import {
  useGetSecurityStatusQuery,
  useSetPinMutation,
  useChangePinMutation,
  useRequestOtpMutation,
  useVerifyOtpMutation,
} from "@/redux/services/securityApi";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/common/Toast";
import type { OtpPurpose } from "@/types/api";

function VerificationRow({
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


function OtpEntry({ purpose, onDone, onCancel }: { purpose: OtpPurpose; onDone: () => void; onCancel: () => void }) {
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
          className="h-10 px-4 rounded-lg text-xs lg:text-[13px]     disabled:opacity-50"
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

export default function SecurityPanel({ hasPhone }: { hasPhone: boolean }) {
  const { data, isLoading } = useGetSecurityStatusQuery();
  const [requestOtp] = useRequestOtpMutation();
  const [setPin, { isLoading: settingPin }] = useSetPinMutation();
  const [changePin, { isLoading: changingPin }] = useChangePinMutation();

  const [pendingOtp, setPendingOtp] = useState<OtpPurpose | null>(null);
  const [pinForm, setPinForm] = useState({ currentPin: "", newPin: "" });
  const [showPinForm, setShowPinForm] = useState(false);

  const status = data?.data;

  const startVerification = async (purpose: OtpPurpose) => {
    try {
      await requestOtp(purpose).unwrap();
      showToast("Verification code sent.", "success");
      setPendingOtp(purpose);
    } catch { /* errorMiddleware */ }
  };

  const handlePinSubmit = async () => {
    try {
      if (status?.hasPin) {
        await changePin({ currentPin: pinForm.currentPin, newPin: pinForm.newPin }).unwrap();
        showToast("PIN changed.", "success");
      } else {
        await setPin({ pin: pinForm.newPin }).unwrap();
        showToast("PIN set.", "success");
      }
      setPinForm({ currentPin: "", newPin: "" });
      setShowPinForm(false);
    } catch { /* errorMiddleware */ }
  };

  if (isLoading) {
    return <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <p className="text-xs lg:text-[13px]     uppercase mb-3" style={{ color: "#a3a6af" }}>Verification</p>
        <div className="rounded-xl border px-4" style={{ borderColor: "#e8e6e3" }}>
          <VerificationRow
            icon={Mail} label="Email Verification"
            verified={status?.isEmailVerified ?? false}
            onVerify={() => startVerification("email_verify")}
            verifying={pendingOtp === "email_verify"}
          />
          {hasPhone && (
            <VerificationRow
              icon={Phone} label="Phone Verification"
              verified={status?.isPhoneVerified ?? false}
              onVerify={() => startVerification("phone_verify")}
              verifying={pendingOtp === "phone_verify"}
            />
          )}
        </div>
        {(pendingOtp === "email_verify" || pendingOtp === "phone_verify") && (
          <OtpEntry purpose={pendingOtp} onDone={() => setPendingOtp(null)} onCancel={() => setPendingOtp(null)} />
        )}
      </section>

      <section>
        <p className="text-xs lg:text-[13px]     uppercase mb-3" style={{ color: "#a3a6af" }}>Two-Factor Authentication</p>
        <div className="rounded-xl border p-4 flex items-center justify-between" style={{ borderColor: "#e8e6e3" }}>
          <div className="flex items-center gap-3">
            <ShieldCheck size={16} style={{ color: "#4c4c4c" }} />
            <div>
              <p className="text-xs lg:text-[13px]   " style={{ color: "var(--color-ink)" }}>
                {status?.twoFactorEnabled ? "2FA is on" : "2FA is off"}
              </p>
              <p className="text-xs lg:text-[13px]   mt-0.5" style={{ color: "#777b86" }}>
                Each time you perform a sensitive action, you'll need to authenticate with a code.
              </p>
            </div>
          </div>
          <button
            onClick={() => startVerification(status?.twoFactorEnabled ? "two_factor_disable" : "two_factor_enable")}
            className="text-xs lg:text-[13px]     px-3 py-1.5 rounded-full shrink-0"
            style={{
              backgroundColor: status?.twoFactorEnabled ? "#fee2e2" : "var(--color-ink)",
              color: status?.twoFactorEnabled ? "#991b1b" : "var(--color-canvas)",
            }}
          >
            {status?.twoFactorEnabled ? "Turn off" : "Turn on"}
          </button>
        </div>
        {(pendingOtp === "two_factor_enable" || pendingOtp === "two_factor_disable") && (
          <OtpEntry purpose={pendingOtp} onDone={() => setPendingOtp(null)} onCancel={() => setPendingOtp(null)} />
        )}
      </section>

      <section>
        <p className="text-xs lg:text-[13px]     uppercase mb-3" style={{ color: "#a3a6af" }}>Transaction PIN</p>
        <div className="rounded-xl border p-4" style={{ borderColor: "#e8e6e3" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyRound size={16} style={{ color: "#4c4c4c" }} />
              <p className="text-xs lg:text-[13px]   " style={{ color: "var(--color-ink)" }}>
                {status?.hasPin ? "PIN is set" : "No PIN set"}
              </p>
            </div>
            <button
              onClick={() => setShowPinForm((v) => !v)}
              className="text-xs lg:text-[13px]     px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "#f2f0ed", color: "var(--color-ink)" }}
            >
              {status?.hasPin ? "Change PIN" : "Set PIN"}
            </button>
          </div>
          {showPinForm && (
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t" style={{ borderColor: "#f2f0ed" }}>
              {status?.hasPin && (
                <Input
                  type="password"
                  label="Current PIN"
                  value={pinForm.currentPin}
                  onChange={(e) => setPinForm((f) => ({ ...f, currentPin: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                />
              )}
              <Input
                type="password"
                label="New PIN (4-6 digits)"
                value={pinForm.newPin}
                onChange={(e) => setPinForm((f) => ({ ...f, newPin: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
              />
              <button
                onClick={handlePinSubmit}
                disabled={settingPin || changingPin || pinForm.newPin.length < 4}
                className="h-10 rounded-lg text-xs lg:text-[13px]     disabled:opacity-50 w-fit px-5"
                style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
              >
                Save PIN
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}