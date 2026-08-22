import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/common/Toast";
import {
  useGetSecurityStatusQuery,
  useSetPinMutation,
  useChangePinMutation,
} from "@/redux/services/securityApi";

// Set (first time) or change (already has one) a transaction PIN, split
// out of the old combined SecurityPanel into its own nav tab, matching
// the reference's separate "Change Rise PIN" menu item.
export default function ChangePinTab() {
  const { data, isLoading } = useGetSecurityStatusQuery();
  const [setPin, { isLoading: settingPin }] = useSetPinMutation();
  const [changePin, { isLoading: changingPin }] = useChangePinMutation();

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");

  if (isLoading || !data) {
    return <div className="h-40 rounded-xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />;
  }

  const hasPin = data.data.hasPin;

  const handleSubmit = async () => {
    try {
      if (hasPin) {
        await changePin({ currentPin, newPin }).unwrap();
        showToast("PIN changed.", "success");
      } else {
        await setPin({ pin: newPin }).unwrap();
        showToast("PIN set.", "success");
      }
      setCurrentPin("");
      setNewPin("");
    } catch { /* errorMiddleware */ }
  };

  return (
    <div className="flex flex-col gap-4" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-center gap-3">
        <KeyRound size={16} style={{ color: "#4c4c4c" }} />
        <p className="text-xs lg:text-[13px]   " style={{ color: "var(--color-ink)" }}>
          {hasPin ? "Change your PIN" : "Set a transaction PIN"}
        </p>
      </div>

      {hasPin && (
        <Input
          type="password"
          label="Current PIN"
          value={currentPin}
          onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      )}
      <Input
        type="password"
        label="New PIN (4-6 digits)"
        value={newPin}
        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
      />
      <button
        onClick={handleSubmit}
        disabled={settingPin || changingPin || newPin.length < 4 || (hasPin && currentPin.length < 4)}
        className="h-10 rounded-lg text-xs lg:text-[13px]     disabled:opacity-50 w-fit px-5"
        style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
      >
        {hasPin ? "Change PIN" : "Set PIN"}
      </button>
    </div>
  );
}