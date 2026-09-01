import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/components/common/AuthLayout";
import { Input } from "@/components/ui/input";
import { useAcceptInvitationMutation } from "@/redux/services/invitationApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/redux/slices/authSlice";
import { showToast } from "@/components/common/Toast";
import type { User } from "@/types/api";

const schema = z
  .object({
    email: z.string().email(),
    code: z.string().min(6, "Enter the 6-digit code from the email"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [accept, { isLoading }] = useAcceptInvitationMutation();

  const defaults = useMemo(
    () => ({
      email: params.get("email") ?? "",
      code: params.get("code") ?? "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    }),
    [params],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await accept({
        email: data.email.trim(),
        code: data.code.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        password: data.password,
      }).unwrap();

      const { accessToken, refreshToken, user } = res.data;
      dispatch(
        setCredentials({
          user: {
            id: user.id,
            email: user.email ?? data.email,
            firstName: user.firstName ?? data.firstName,
            lastName: user.lastName ?? data.lastName,
            userType: user.userType as User["userType"],
            tenantId: user.tenantId ?? null,
          } as User,
          accessToken,
          refreshToken,
        }),
      );
      showToast("Welcome to the team.", "success");
      navigate("/dashboard");
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Could not accept invitation.";
      showToast(message, "error");
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-6 w-full max-w-md">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--color-ink)" }}
          >
            Accept invitation
          </h1>
          <p
            className="text-sm lg:text-base mt-2"
            style={{ color: "var(--color-muted-stone)" }}
          >
            Create your account to join the workspace. Use the code from your
            invite email.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#777b86]">Email</label>
            <Input type="email" {...register("email")} autoComplete="email" />
            {errors.email && (
              <p className="text-[11px] text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#777b86]">Invitation code</label>
            <Input
              {...register("code")}
              placeholder="6-digit code"
              autoComplete="one-time-code"
            />
            {errors.code && (
              <p className="text-[11px] text-red-600">{errors.code.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#777b86]">First name</label>
              <Input {...register("firstName")} autoComplete="given-name" />
              {errors.firstName && (
                <p className="text-[11px] text-red-600">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#777b86]">Last name</label>
              <Input {...register("lastName")} autoComplete="family-name" />
              {errors.lastName && (
                <p className="text-[11px] text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#777b86]">Password</label>
            <Input
              type="password"
              {...register("password")}
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="text-[11px] text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#777b86]">Confirm password</label>
            <Input
              type="password"
              {...register("confirmPassword")}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="text-[11px] text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="h-11 rounded-full text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: "#1a56ff" }}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Join workspace
          </button>
        </form>

        <p className="text-xs text-center text-[#777b86]">
          Already have an account?{" "}
          <Link to="/login" className="underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
