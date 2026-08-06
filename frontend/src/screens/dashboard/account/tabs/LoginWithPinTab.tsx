import { useGetSecurityStatusQuery, useSetLoginWithPinMutation } from "@/redux/services/securityApi";
import { showToast } from "@/components/common/Toast";
import { KeyRound } from "lucide-react";

// Preference only today: the login endpoint doesn't branch on this yet,
// it's still email/password. This toggle stores intent ahead of that
// flow being built, don't present it to users as already-functional
// PIN login without checking with backend work first.
export default function LoginWithPinTab() {
  const { data, isLoading } = useGetSecurityStatusQuery();
  const [setLoginWithPin, { isLoading: saving }] = useSetLoginWithPinMutation();

  if (isLoading || !data) {
    return <div className="h-32 rounded-xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />;
  }

  const { loginWithPinEnabled, hasPin } = data.data;

  const handleToggle = async () => {
    if (!hasPin && !loginWithPinEnabled) {
      showToast("Set a transaction PIN first, under Change PIN.", "error");
      return;
    }
    try {
      await setLoginWithPin(!loginWithPinEnabled).unwrap();
      showToast(loginWithPinEnabled ? "PIN login disabled." : "PIN login enabled.", "success");
    } catch { /* errorMiddleware */ }
  };

  return (
    <div className="rounded-xl border p-4 flex items-center justify-between" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-center gap-3">
        <KeyRound size={16} style={{ color: "#4c4c4c" }} />
        <div>
          <p className="text-xs lg:text-sm" style={{ color: "var(--color-ink)" }}>Log in with PIN</p>
          <p className="text-xs lg:text-smmt-0.5" style={{ color: "#777b86" }}>
            Use your transaction PIN instead of your password to log in.
          </p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={loginWithPinEnabled}
        onClick={handleToggle}
        disabled={saving}
        className="w-11 h-6 rounded-full relative transition-colors disabled:opacity-50 shrink-0"
        style={{ backgroundColor: loginWithPinEnabled ? "var(--color-ink)" : "#e8e6e3" }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
          style={{ transform: loginWithPinEnabled ? "translateX(22px)" : "translateX(2px)" }}
        />
      </button>
    </div>
  );
}