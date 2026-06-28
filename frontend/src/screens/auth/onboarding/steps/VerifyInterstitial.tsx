import { Mail, RefreshCw } from "lucide-react";

interface Props {
  email:       string;
  onContinue:  () => void;
  onResend:    () => void;
  isResending: boolean;
}

export default function VerifyInterstitial({ email, onContinue, onResend, isResending }: Props) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-fog)" }}
    >
      <div className="max-w-md w-full bg-white p-10 flex flex-col gap-6 rounded-2xl shadow-sm">
        <div
          className="w-14 h-14 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: "var(--color-warm-mist)" }}
        >
          <Mail size={24} style={{ color: "var(--color-terracotta)" }} />
        </div>

        <div className="flex flex-col gap-2">
          <h1
            className="text-[28px] leading-[1.1]"
            style={{ color: "var(--color-ink)", letterSpacing: "-0.5px" }}
          >
            Check your email
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted-stone)" }}>
            We sent a 6-digit verification code to{" "}
            <span style={{ color: "var(--color-ink)" }}>{email}</span>.
          </p>
        </div>

        <div
          className="flex flex-col gap-3 p-4"
          style={{ backgroundColor: "var(--color-fog)", border: "1px solid #e8e6e3" }}
        >
          <p
            className="text-xs uppercase tracking-widest bold"
            style={{ color: "var(--color-muted-stone)" }}
          >
            What to do next
          </p>
          {[
            "Open your email inbox",
            "Find the email from Booking Platform",
            "Click the button below and enter the 6-digit code",
          ].map((step, i) => (
            <div key={step} className="flex items-start gap-3">
              <span
                className="w-5 h-5 flex items-center justify-center text-xs shrink-0 mt-0.5"
                style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
              >
                {i + 1}
              </span>
              <p className="text-sm" style={{ color: "var(--color-muted-stone)" }}>{step}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onContinue}
          className="w-full h-12 flex items-center justify-center text-sm transition-opacity hover:opacity-80 rounded-full"
          style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
        >
          Enter the code →
        </button>

        <button
          onClick={onResend}
          disabled={isResending}
          className="flex items-center justify-center gap-2 text-sm transition-opacity hover:opacity-60 disabled:opacity-40"
          style={{ color: "var(--color-muted-stone)" }}
        >
          <RefreshCw size={13} className={isResending ? "animate-spin" : ""} />
          {isResending ? "Resending..." : "Didn't receive it? Resend"}
        </button>

        <p className="text-xs text-center" style={{ color: "var(--color-hint-of-grey)" }}>
          Code expires in 15 minutes.
        </p>
      </div>
    </div>
  );
}