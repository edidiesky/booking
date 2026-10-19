import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  setCredentials,
  setOnboardingShowVerify,
  setOnboardingPendingEmail,
  setOnboardingStep,
  resetOnboarding,
  selectOnboardingPendingEmail,
} from "@/redux/slices/authSlice";
import {
  useInitiateOnboardingMutation,
  useConfirmEmailMutation,
  useResendOtpMutation,
  useRegisterGuestMutation,
  useRegisterHostMutation,
} from "@/redux/services/authApi";
import { showToast } from "@/components/common/Toast";
import type {
  InitiateFormData,
  GuestDetailsFormData,
  HostDetailsFormData,
  CreatePropertyFormData,
} from "../schema/onboarding.schema";
import type { User } from "@/types/api";

export type UserChoice = "guest" | "host";

export function useOnboarding() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pendingEmail = useSelector(selectOnboardingPendingEmail);

  const [hostData, setHostData] = useState<HostDetailsFormData | null>(null);

  const [initiate, { isLoading: initiating }] = useInitiateOnboardingMutation();
  const [confirmEmail, { isLoading: confirming }] = useConfirmEmailMutation();
  const [resendOtp, { isLoading: resending }] = useResendOtpMutation();
  const [registerGuest, { isLoading: guestReg }] = useRegisterGuestMutation();
  const [registerHost, { isLoading: hostReg }] = useRegisterHostMutation();

  const handleInitiate = async (data: InitiateFormData) => {
    try {
      const res = await initiate({
        email: data.email,
        password: data.password,
      }).unwrap();
      dispatch(setOnboardingPendingEmail(data.email));
      dispatch(setOnboardingShowVerify(true));
      if (res.debug) {
        showToast(`Dev OTP: ${res.debug}`, "info", { duration: 3_000 });
      }
    } catch {
      /* errorMiddleware */
    }
  };

  const handleConfirmOtp = async (token: string) => {
    try {
      await confirmEmail({ email: pendingEmail, token }).unwrap();
      dispatch(setOnboardingShowVerify(false));
      dispatch(setOnboardingStep(3));
    } catch {
      /* errorMiddleware */
    }
  };

  const handleResend = async () => {
    try {
      const res = await resendOtp({ email: pendingEmail }).unwrap();
      showToast(res.message, "success");
    } catch {
      /* errorMiddleware */
    }
  };

  const handleGuestDetails = async (data: GuestDetailsFormData) => {
    try {
      const result = await registerGuest({
        email: pendingEmail,
        ...data,
      }).unwrap();
      dispatch(
        setCredentials({
          user: result.data.user as unknown as User,
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        }),
      );
      showToast("Account created! Welcome.", "success");
      dispatch(resetOnboarding());
      navigate("/");
    } catch {
      /* errorMiddleware */
    }
  };

  /** Step 3 host → save details and go to StepCreateProperty */
  const handleHostDetails = (data: HostDetailsFormData) => {
    setHostData(data);
    dispatch(setOnboardingStep(4));
  };

  /** Step 4 → register host + tenant */
  const handleCreateProperty = async (data: CreatePropertyFormData) => {
    if (!hostData) {
      showToast("Please complete your personal details first.", "error");
      dispatch(setOnboardingStep(3));
      return;
    }

    try {
      const result = await registerHost({
        email: pendingEmail,
        firstName: hostData.firstName,
        lastName: hostData.lastName,
        phone: hostData.phone,
        tenantName: data.tenantName,
        tenantSlug: data.tenantSlug,
        platformFeePct: data.platformFeePct,
      }).unwrap();

      dispatch(
        setCredentials({
          user: result.data.user as unknown as User,
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
          tenantSlug: data.tenantSlug,
        }),
      );
      showToast("Workspace created.", "success");
      dispatch(resetOnboarding());
      navigate("/dashboard");
    } catch {
      /* errorMiddleware */
    }
  };

  return {
    pendingEmail,
    hostData,
    handleInitiate,
    initiating,
    handleConfirmOtp,
    confirming,
    handleResend,
    resending,
    handleGuestDetails,
    guestReg,
    handleHostDetails,
    handleCreateProperty,
    hostReg,
  };
}