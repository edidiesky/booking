import { useState } from "react";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/common/Toast";
import { useChangePasswordMutation } from "@/redux/services/authApi";

export default function PasswordResetTab() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < 8;

  const handleSubmit = async () => {
    if (mismatch || tooShort || !currentPassword) return;
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      showToast("Password changed.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch { /* errorMiddleware */ }
  };

  return (
    <div className="rounded-xl border p-5 flex flex-col gap-4 max-w-sm" style={{ borderColor: "#e8e6e3" }}>
      <div className="flex items-center gap-3">
        <Lock size={16} style={{ color: "#4c4c4c" }} />
        <p className="text-xs bold" style={{ color: "var(--color-ink)" }}>Reset your password</p>
      </div>

      <Input
        type="password"
        label="Current password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <Input
        type="password"
        label="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        error={tooShort ? "Must be at least 8 characters." : undefined}
      />
      <Input
        type="password"
        label="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={mismatch ? "Passwords don't match." : undefined}
      />

      <button
        onClick={handleSubmit}
        disabled={isLoading || !currentPassword || tooShort || mismatch || !confirmPassword}
        className="h-10 rounded-lg text-xs bold disabled:opacity-50 w-fit px-5"
        style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
      >
        {isLoading ? "Saving..." : "Change Password"}
      </button>
    </div>
  );
}