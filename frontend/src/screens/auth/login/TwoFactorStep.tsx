import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/common/Toast";
import { useVerifyTwoFactorLoginMutation } from "@/redux/services/authApi";
import type { AuthTokens } from "@/types/api";

interface Props {
  challengeToken: string;
  onVerified: (result: AuthTokens) => void;
}

export default function TwoFactorStep({ challengeToken, onVerified }: Props) {
  const [code, setCode] = useState("");
  const [verify, { isLoading }] = useVerifyTwoFactorLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length < 6) return;

    try {
      const result = await verify({
        challengeToken,
        code: trimmed,
      }).unwrap();
      onVerified(result);
    } catch (err: unknown) {
      const error = err as { data?: { error?: string[] }; error?: string };
      (error?.data?.error ?? [error?.error ?? "Invalid code."]).forEach((m) =>
        showToast(m, "error"),
      );
      setCode("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1
          className="text-[32px] leading-[1.1]"
          style={{ color: "var(--color-ink)", letterSpacing: "-0.66px" }}
        >
          Enter your code
        </h1>
        <p
          className="text-xs lg:text-[13px]"
          style={{ color: "var(--color-muted-stone)" }}
        >
          Open your authenticator app and enter the 6-digit code, or use a
          backup code.
        </p>
      </div>

      <Input
        label="Verification code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        icon={<ShieldCheck size={15} />}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
        maxLength={10}
        autoFocus
      />

      <button
        type="submit"
        disabled={isLoading || code.trim().length < 6}
        className="w-full h-12 flex items-center justify-center text-xs lg:text-sm rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{
          backgroundColor: "var(--color-vivid)",
          color: "var(--color-vivid-foreground)",
        }}
      >
        {isLoading ? "Verifying..." : "Verify and sign in"}
      </button>
    </form>
  );
}
