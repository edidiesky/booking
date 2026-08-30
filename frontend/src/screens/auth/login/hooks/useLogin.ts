import { useState } from "react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useNavigate, useLocation } from "react-router-dom";
import { setCredentials } from "@/redux/slices/authSlice";
import {
  useLoginMutation,
  useVerifyLoginEmailOtpMutation,
} from "@/redux/services/authApi";
import { tenantApi } from "@/redux/services/tenantApi";
import { showToast } from "@/components/common/Toast";
import type { LoginFormData } from "../schema/login.schema";
import type { User, AuthTokens } from "@/types/api";

type LoginStep =
  | { step: "password" }
  | { step: "email_otp"; email: string }
  | { step: "totp"; challengeToken: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function useLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [verifyEmailOtp, { isLoading: isOtpLoading }] =
    useVerifyLoginEmailOtpMutation();

  const [loginStep, setLoginStep] = useState<LoginStep>({ step: "password" });

  const clearChallenge = () => setLoginStep({ step: "password" });

  const finishLogin = async (result: AuthTokens) => {
    const user: User = result.data.user as unknown as User;
    const userType = user.userType;

    dispatch(
      setCredentials({
        user,
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
      }),
    );

    if (userType.startsWith("host:") && user.tenantId) {
      try {
        const tenantResult = await dispatch(
          tenantApi.endpoints.getMyTenant.initiate(undefined, {
            forceRefetch: true,
          }),
        ).unwrap();

        dispatch(
          setCredentials({
            user,
            accessToken: result.data.accessToken,
            tenantSlug: tenantResult.data.slug,
          }),
        );
      } catch {
        /* non-blocking */
      }
    }

    showToast("Welcome back!", "success");

    if (userType === "platform:admin") {
      navigate("/admin", { replace: true });
      return;
    }
    if (userType.startsWith("host:")) {
      navigate("/dashboard", { replace: true });
      return;
    }
    navigate(from, { replace: true });
  };

  const handleLogin = async (data: LoginFormData) => {
    try {
      const result = await login({
        email: data.email,
        password: data.password,
      }).unwrap();

      const payload = (isRecord(result) && isRecord(result.data)
        ? result.data
        : result) as Record<string, unknown>;

      // Normal user → email OTP
      if (payload.emailOtpRequired === true && typeof payload.email === "string") {
        setLoginStep({ step: "email_otp", email: payload.email });
        return;
      }

      // Authenticator already enabled → TOTP
      if (
        payload.twoFactorRequired === true &&
        typeof payload.challengeToken === "string"
      ) {
        setLoginStep({
          step: "totp",
          challengeToken: payload.challengeToken,
        });
        return;
      }

      await finishLogin(result as AuthTokens);
    } catch {
      /* handled by rtkQueryErrorMiddleware */
    }
  };

  const handleVerifyEmailOtp = async (code: string) => {
    if (loginStep.step !== "email_otp") return;

    try {
      const result = await verifyEmailOtp({
        email: loginStep.email,
        code,
      }).unwrap();
      await finishLogin(result as AuthTokens);
    } catch {
      /* handled by rtkQueryErrorMiddleware */
    }
  };

  return {
    handleLogin,
    handleVerifyEmailOtp,
    isLoading: isLoginLoading || isOtpLoading,
    loginStep,
    challengeToken:
      loginStep.step === "totp" ? loginStep.challengeToken : null,
    emailForOtp: loginStep.step === "email_otp" ? loginStep.email : null,
    finishLogin,
    clearChallenge,
  };
}