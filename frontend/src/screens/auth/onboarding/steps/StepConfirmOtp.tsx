import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

interface Props {
  email: string;
  onSubmit: (token: string) => Promise<void>;
  onResend: () => void;
  isLoading: boolean;
  isResending: boolean;
}

export default function StepConfirmOtp({
  email,
  onSubmit,
  onResend,
  isLoading,
  isResending,
}: Props) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < OTP_LENGTH - 1) inputRefs.current[i + 1]?.focus();
    if (next.every((d) => d !== "") && next.join("").length === OTP_LENGTH) {
      void onSubmit(next.join(""));
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0)
      inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").slice(0, OTP_LENGTH);
    if (!/^\d+$/.test(pasted)) return;
    const next = pasted
      .split("")
      .concat(Array(OTP_LENGTH).fill(""))
      .slice(0, OTP_LENGTH);
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    if (pasted.length === OTP_LENGTH) void onSubmit(pasted);
  };

  const handleResend = () => {
    onResend();
    setCountdown(RESEND_COOLDOWN);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1
          className="text-[32px] leading-[1.1]"
          style={{ color: "var(--color-ink)", letterSpacing: "-0.66px" }}
        >
          Enter your code
        </h1>
        <p
          className="text-[15px]"
          style={{ color: "var(--color-muted-stone)" }}
        >
          We sent a 6-digit code to{" "}
          <span style={{ color: "var(--color-ink)" }}>{email}</span>.
        </p>
      </div>

      <div className="flex gap-2 max-w-[400px]" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <motion.input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="flex-1 h-14 text-center text-xl w-full  rounded-[12px] border-2 transition-all outline-none focus:ring-0"
            style={{
              borderColor: digit
                ? "var(--color-ink)"
                : "var(--color-stone-surface)",
              backgroundColor: digit
                ? "var(--color-fog)"
                : "var(--color-canvas)",
              color: "var(--color-ink)",
            }}
            whileFocus={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        ))}
      </div>

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--color-muted-stone)" }}>
          Verifying...
        </p>
      )}

      <button
        onClick={handleResend}
        disabled={countdown > 0 || isResending}
        className="text-sm transition-opacity disabled:opacity-40 text-left"
        style={{ color: "var(--color-muted-stone)" }}
      >
        {countdown > 0
          ? `Resend code in ${countdown}s`
          : isResending
            ? "Sending..."
            : "Resend code"}
      </button>

      <p className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>
        Wrong email?{" "}
        <button
          onClick={() => history.back()}
          className="underline underline-offset-4"
          style={{ color: "var(--color-ink)" }}
        >
          Go back
        </button>
      </p>
    </div>
  );
}
