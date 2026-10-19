import { Mail } from "lucide-react";
import AuthLayout from "@/components/common/AuthLayout";

interface Props {
  email: string;
  onContinue: () => void;
  onResend: () => void;
  isResending: boolean;
  stepLabels?: string[];
  currentStep?: number;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(4, local.length));
  return `${visible}•••@${domain}`;
}

export default function VerifyInterstitial({
  email,
  onContinue,
  onResend,
  isResending,
  stepLabels = ["Create account", "Verify email", "Your details"],
  currentStep = 2,
}: Props) {
  return (
    <AuthLayout stepLabels={stepLabels} currentStep={currentStep}>
      <div className="flex flex-col items-center text-center gap-6">
        {/* Envelope mark */}
        <div className="w-14 h-14 rounded-2xl border border-dashed border-[#d8dce3] flex items-center justify-center">
          <Mail size={22} className="text-[#a3a8b3]" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col gap-2">
          <h4
            className="text-xl lg:text-2xl font-semibold"
            style={{ color: "var(--color-ink)" }}
          >
            Verify your email
          </h4>
          <p className="text-[15px] text-[#777b86] leading-relaxed max-w-sm mx-auto">
            We&apos;ll send a 6-digit verification code to{" "}
            <span className="text-[#17191c] font-medium">
              {maskEmail(email)}
            </span>
            . Enter this code to verify your email.
          </p>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-full h-12 rounded-full text-[15px] font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Request OTP
        </button>

        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          className="text-[14px] text-[#777b86] hover:text-[#17191c] disabled:opacity-40 transition-colors"
        >
          {isResending ? "Sending…" : "Didn\u2019t get a code? Resend"}
        </button>
      </div>
    </AuthLayout>
  );
}
