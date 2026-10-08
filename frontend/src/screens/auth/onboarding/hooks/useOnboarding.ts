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
} from "@/redux/services/authApi";
import { showToast } from "@/components/common/Toast";
import type {
  InitiateFormData,
  GuestDetailsFormData,
  HostDetailsFormData,
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
      /* errorMiddleware handles toast */
    }
  };

  const handleConfirmOtp = async (token: string) => {
    try {
      await confirmEmail({ email: pendingEmail, token }).unwrap();
      dispatch(setOnboardingShowVerify(false));
      dispatch(setOnboardingStep(3));
    } catch {
      /* errorMiddleware handles toast */
    }
  };

  const handleResend = async () => {
    try {
      const res = await resendOtp({ email: pendingEmail }).unwrap();
      showToast(res.message, "success");
    } catch {
      /* errorMiddleware handles toast */
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
      /* errorMiddleware handles toast */
    }
  };

  const handleHostDetails = (data: HostDetailsFormData) => {
    setHostData(data);
  };

  const clearHostData = () => setHostData(null);

  return {
    pendingEmail,
    hostData,
    clearHostData,
    handleInitiate,
    initiating,
    handleConfirmOtp,
    confirming,
    handleResend,
    resending,
    handleGuestDetails,
    guestReg,
    handleHostDetails,
  };
}