import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/common/Toast";
import {
  useSetupTwoFactorMutation,
  useVerifyEnableTwoFactorMutation,
  useDisableTwoFactorMutation,
} from "@/redux/services/authApi";

interface Props {
  enabled: boolean;
  onChanged?: () => void;
}

export default function TwoFactorSection({ enabled, onChanged }: Props) {
  const [setup, { isLoading: settingUp }] = useSetupTwoFactorMutation();
  const [verifyEnable, { isLoading: verifying }] =
    useVerifyEnableTwoFactorMutation();
  const [disable, { isLoading: disabling }] = useDisableTwoFactorMutation();

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [password, setPassword] = useState("");
  const [showDisable, setShowDisable] = useState(false);

  const startSetup = async () => {
    try {
      const res = await setup().unwrap();

      const payload =
        "data" in res && res.data
          ? res.data
          : (res as unknown as { secret: string; qrCodeDataUrl: string });

      setQrCodeDataUrl(payload.qrCodeDataUrl);
      setSecret(payload.secret);
      setBackupCodes(null);
    } catch {
      /* errorMiddleware */
    }
  };

  const confirmSetup = async () => {
    if (code.trim().length < 6) return;
    try {
      const res = await verifyEnable({ token: code.trim() }).unwrap();
      const data = (res as { data?: { backupCodes?: string[] } }).data ?? res;
      setBackupCodes((data as { backupCodes?: string[] }).backupCodes ?? []);
      setQrCodeDataUrl(null);
      setSecret(null);
      setCode("");
      showToast("Authenticator enabled.", "success");
      onChanged?.();
    } catch {
      /* errorMiddleware */
    }
  };

  const confirmDisable = async () => {
    try {
      await disable({ password }).unwrap();
      setShowDisable(false);
      setPassword("");
      showToast("Two-factor disabled.", "success");
      onChanged?.();
    } catch {
      /* errorMiddleware */
    }
  };

  return (
    <section>
      <p
        className="text-xs lg:text-[13px] uppercase mb-3"
        style={{ color: "#a3a6af" }}
      >
        Authenticator app
      </p>

      <div
        className="rounded-xl border p-4 flex items-center justify-between"
        style={{ borderColor: "#e8e6e3" }}
      >
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} style={{ color: "#4c4c4c" }} />
          <div>
            <p
              className="text-xs lg:text-[13px]"
              style={{ color: "var(--color-ink)" }}
            >
              {enabled ? "Authenticator is on" : "Authenticator is off"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#777b86" }}>
              Use Google Authenticator or Authy when you sign in.
            </p>
          </div>
        </div>

        {!enabled && !qrCodeDataUrl && (
          <button
            type="button"
            onClick={startSetup}
            disabled={settingUp}
            className="text-xs lg:text-[13px] px-3 py-1.5 rounded-full shrink-0 disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-ink)",
              color: "var(--color-canvas)",
            }}
          >
            {settingUp ? "Starting…" : "Turn on"}
          </button>
        )}

        {enabled && (
          <button
            type="button"
            onClick={() => setShowDisable(true)}
            className="text-xs lg:text-[13px] px-3 py-1.5 rounded-full shrink-0"
            style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
          >
            Turn off
          </button>
        )}
      </div>

      {/* Setup: QR + code */}
      {qrCodeDataUrl && (
        <div
          className="mt-3 p-4 rounded-xl border flex flex-col gap-3"
          style={{ borderColor: "#e8e6e3", backgroundColor: "#fafaf9" }}
        >
          <p className="text-xs" style={{ color: "#777b86" }}>
            Scan this QR code with Google Authenticator, then enter the 6-digit
            code.
          </p>
          <img
            src={qrCodeDataUrl}
            alt="Authenticator QR"
            className="w-40 h-40 self-center rounded-lg border"
            style={{ borderColor: "#e8e6e3" }}
          />
          {secret && (
            <p
              className="text-[11px] break-all text-center"
              style={{ color: "#777b86" }}
            >
              Or enter key manually:{" "}
              <strong style={{ color: "#17191c" }}>{secret}</strong>
            </p>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="flex-1"
            />
            <button
              type="button"
              onClick={confirmSetup}
              disabled={code.length !== 6 || verifying}
              className="h-10 px-4 rounded-lg text-xs disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-ink)",
                color: "var(--color-canvas)",
              }}
            >
              {verifying ? "Verifying…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => {
                setQrCodeDataUrl(null);
                setSecret(null);
                setCode("");
              }}
              className="h-10 px-3 text-xs"
              style={{ color: "#777b86" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Backup codes — show once */}
      {backupCodes && backupCodes.length > 0 && (
        <div
          className="mt-3 p-4 rounded-xl border"
          style={{ borderColor: "#e8e6e3", backgroundColor: "#fafaf9" }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: "#17191c" }}>
            Save these backup codes
          </p>
          <p className="text-[11px] mb-2" style={{ color: "#777b86" }}>
            Each code works once if you lose your authenticator.
          </p>
          <ul
            className="grid grid-cols-2 gap-1 text-xs "
            style={{ color: "#17191c" }}
          >
            {backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-3 text-xs underline"
            style={{ color: "#777b86" }}
            onClick={() => setBackupCodes(null)}
          >
            I’ve saved them
          </button>
        </div>
      )}

      {/* Disable with password */}
      {showDisable && (
        <div
          className="mt-3 p-4 rounded-xl border flex flex-col gap-2"
          style={{ borderColor: "#e8e6e3" }}
        >
          <p className="text-xs" style={{ color: "#777b86" }}>
            Enter your password to turn off authenticator.
          </p>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmDisable}
              disabled={!password || disabling}
              className="h-10 px-4 rounded-lg text-xs disabled:opacity-50"
              style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
            >
              {disabling ? "Disabling…" : "Disable"}
            </button>
            <button
              type="button"
              onClick={() => setShowDisable(false)}
              className="h-10 px-3 text-xs"
              style={{ color: "#777b86" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
