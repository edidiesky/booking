import { useRef }      from "react";
import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link }        from "react-router-dom";
import { Mail, Lock }  from "lucide-react";
import { Input }       from "@/components/ui/input";
import GoogleAuthButton from "@/components/common/GoogleAuthButton";
import { initiateSchema, type InitiateFormData } from "../schema/onboarding.schema";

interface Props {
  onSubmit:   (d: InitiateFormData) => Promise<void>;
  isLoading:  boolean;
  userChoice: "guest" | "host";
}

export default function StepInitiate({ onSubmit, isLoading, userChoice }: Props) {
  const fieldsRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<InitiateFormData>({
    resolver: zodResolver(initiateSchema),
  });

  const shake = () => {
    const el = fieldsRef.current;
    if (!el) return;
    el.classList.remove("shake");
    el.getBoundingClientRect();
    el.classList.add("shake");
    el.addEventListener("animationend", () => el.classList.remove("shake"), { once: true });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-[1.1]" style={{ color: "var(--color-ink)", letterSpacing: "-0.5px" }}>
          Set up your account
        </h1>
        <p className="text-[15px]" style={{ color: "var(--color-muted-stone)" }}>
          {userChoice === "host"
            ? "A few details and your first property can go live today."
            : "Takes under a minute, then you're ready to book."}
        </p>
      </div>

      {userChoice === "guest" && (
        <>
          <GoogleAuthButton label="Sign up with Google" />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ backgroundColor: "#e2e2e2" }} />
            <span className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>or use your email</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#e2e2e2" }} />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit, shake)} noValidate className="flex flex-col gap-6">
        <div ref={fieldsRef} className="flex flex-col gap-4">
          <Input
            label="Email address" type="email" placeholder="you@example.com"
            icon={<Mail size={15} />} error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password" type="password" placeholder="Min 8 characters"
            icon={<Lock size={15} />} error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label="Confirm password" type="password" placeholder="Repeat password"
            icon={<Lock size={15} />} error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
        </div>

        <ul className="flex flex-col gap-1.5">
          {["At least 8 characters", "One uppercase letter", "One number"].map((rule) => (
            <li key={rule} className="flex items-center gap-2 text-xs"
                style={{ color: "var(--color-muted-stone)" }}>
              <span className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: "var(--color-muted-stone)" }} />
              {rule}
            </li>
          ))}
        </ul>

        <button
          type="submit" disabled={isLoading}
          className="w-full h-12 rounded-full flex items-center justify-center text-xs lg:text-smtransition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: "var(--color-vivid)", color: "var(--color-vivid-foreground)" }}
        >
          {isLoading ? "Sending OTP..." : "Continue"}
        </button>
      </form>

      <p className="text-xs lg:text-sm text-center" style={{ color: "var(--color-muted-stone)" }}>
        Already have an account?{" "}
        <Link to="/login" className="underline underline-offset-4"
              style={{ color: "var(--color-ink)" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}