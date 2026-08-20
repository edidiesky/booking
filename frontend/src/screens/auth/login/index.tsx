import { useRef }           from "react";
import { useForm }          from "react-hook-form";
import { zodResolver }      from "@hookform/resolvers/zod";
import { Link }             from "react-router-dom";
import { Mail, Lock }       from "lucide-react";
import AuthLayout           from "@/components/common/AuthLayout";
import GoogleAuthButton     from "@/components/common/GoogleAuthButton";
import { Input }            from "@/components/ui/input";
import { loginSchema, type LoginFormData } from "./schema/login.schema";
import { useLogin }         from "./hooks/useLogin";

export default function Login() {
  const { handleLogin, isLoading } = useLogin();
  const fieldsRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
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
    <AuthLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] leading-[1.1]" style={{ color: "var(--color-ink)", letterSpacing: "-0.66px" }}>
            Good to see you again
          </h1>
          <p className="text-xs lg:text-[13px]" style={{ color: "var(--color-muted-stone)" }}>
            Sign in to check on bookings, payouts, and what's happening across your properties.
          </p>
        </div>

        <GoogleAuthButton />

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: "#e2e2e2" }} />
          <span className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>or sign in with email</span>
          <div className="flex-1 h-px" style={{ backgroundColor: "#e2e2e2" }} />
        </div>

        <form onSubmit={handleSubmit(handleLogin, shake)} noValidate className="flex flex-col gap-8">
          <div ref={fieldsRef} className="flex flex-col gap-4">
            <Input label="Email address" type="email" placeholder="you@example.com"
              icon={<Mail size={15} />} error={errors.email?.message} {...register("email")} />
            <Input label="Password" type="password" placeholder="Your password"
              icon={<Lock size={15} />} error={errors.password?.message} {...register("password")} />
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full h-12 flex items-center justify-center text-xs  lg:text-sm rounded-full transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-vivid)", color: "var(--color-vivid-foreground)" }}>
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-xs lg:text-[13px]  text-center" style={{ color: "var(--color-muted-stone)" }}>
          Don't have an account?{" "}
          <Link to="/onboarding" className="underline underline-offset-4" style={{ color: "var(--color-ink)" }}>
            Get started
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}