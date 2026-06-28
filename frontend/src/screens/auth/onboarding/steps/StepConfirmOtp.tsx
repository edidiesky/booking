import { useForm }      from "react-hook-form";
import { zodResolver }  from "@hookform/resolvers/zod";
import { Input }        from "@/components/ui/input";
import { otpSchema, type OtpFormData } from "../schema/onboarding.schema";

interface Props {
  email:      string;
  onSubmit:   (d: OtpFormData) => Promise<void>;
  onResend:   () => void;
  isLoading:  boolean;
  isResending: boolean;
}

export default function StepConfirmOtp({ email, onSubmit, onResend, isLoading, isResending }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<OtpFormData>({ resolver: zodResolver(otpSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-[1.1]" style={{ color: "var(--color-ink)", letterSpacing: "-0.5px" }}>
          Check your email
        </h1>
        <p className="text-[15px]" style={{ color: "var(--color-muted-stone)" }}>
          We sent a 6-digit code to <span style={{ color: "var(--color-ink)" }}>{email}</span>.
        </p>
      </div>

      <Input label="Verification code" type="text" inputMode="numeric" maxLength={6}
        placeholder="123456" error={errors.token?.message} {...register("token")} />

      <button type="submit" disabled={isLoading}
        className="w-full h-12 rounded-full flex items-center justify-center text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}>
        {isLoading ? "Verifying..." : "Verify email"}
      </button>

      <button type="button" onClick={onResend} disabled={isResending}
        className="text-sm text-center transition-opacity hover:opacity-60 disabled:opacity-40"
        style={{ color: "var(--color-muted-stone)" }}>
        {isResending ? "Resending..." : "Didn't receive it? Resend"}
      </button>

      <p className="text-xs text-center" style={{ color: "var(--color-hint-of-grey)" }}>
        Code expires in 15 minutes.
      </p>
    </form>
  );
}