import { useDispatch, useSelector }  from "react-redux";
import { useNavigate }               from "react-router-dom";
import { useState }                  from "react";
import {
  setCredentials, setOnboardingShowVerify,
  setOnboardingPendingEmail, setOnboardingStep,
  resetOnboarding, selectOnboardingPendingEmail,
} from "@/redux/slices/authSlice";
import {
  useInitiateOnboardingMutation, useConfirmEmailMutation,
  useResendOtpMutation, useRegisterGuestMutation,
  useRegisterHostMutation,
} from "@/redux/services/authApi";
import { showToast }  from "@/components/common/Toast";
import type {
  InitiateFormData, GuestDetailsFormData,
  HostDetailsFormData, CreatePropertyFormData,
} from "../schema/onboarding.schema";
import type { User } from "@/types/api";

export type UserChoice = "guest" | "host";

export function useOnboarding(userChoice: UserChoice) {
    console.log("userChoice", userChoice)
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const pendingEmail = useSelector(selectOnboardingPendingEmail);

  const [hostData, setHostData] = useState<HostDetailsFormData | null>(null);

  const [initiate,      { isLoading: initiating  }] = useInitiateOnboardingMutation();
  const [confirmEmail,  { isLoading: confirming  }] = useConfirmEmailMutation();
  const [resendOtp,     { isLoading: resending   }] = useResendOtpMutation();
  const [registerGuest, { isLoading: guestReg    }] = useRegisterGuestMutation();
  const [registerHost,  { isLoading: hostReg     }] = useRegisterHostMutation();

  //  Step 1  email + password 
  const handleInitiate = async (data: InitiateFormData) => {
    try {
      const res = await initiate({ email: data.email, password: data.password }).unwrap();
      dispatch(setOnboardingPendingEmail(data.email));
      dispatch(setOnboardingShowVerify(true));
      if (res.debug) {
        showToast(`Dev OTP: ${res.debug}`, "info", { duration: 30_000 });
      }
    } catch { /* errorMiddleware handles toast */ }
  };

  //  Step 2  verify OTP 
  const handleConfirmOtp = async (token: string) => {
    try {
      await confirmEmail({ email: pendingEmail, token }).unwrap();
      dispatch(setOnboardingShowVerify(false));
      dispatch(setOnboardingStep(3));
    } catch { /* errorMiddleware handles toast */ }
  };

  //  Resend OTP 
  const handleResend = async () => {
    try {
      const res = await resendOtp({ email: pendingEmail }).unwrap();
      showToast(res.message, "success");
    } catch { /* errorMiddleware handles toast */ }
  };

  const handleGuestDetails = async (data: GuestDetailsFormData) => {
    try {
      const result = await registerGuest({ email: pendingEmail, ...data }).unwrap();
      dispatch(setCredentials({
        user:         result.user as unknown as User,
        accessToken:  result.accessToken,
        refreshToken: result.refreshToken,
      }));
      showToast("Account created! Welcome.", "success");
      dispatch(resetOnboarding());
      navigate("/");
    } catch { /* errorMiddleware handles toast */ }
  };

  //  Step 3 host  personal details → advance to step 4 
  const handleHostDetails = (data: HostDetailsFormData) => {
    setHostData(data);
    dispatch(setOnboardingStep(4));
  };

  //  Step 4 host  property details → register 
  const handleCreateProperty = async (propertyData: CreatePropertyFormData) => {
    if (!hostData) return;
    try {
      const result = await registerHost({
        email:          pendingEmail,
        firstName:      hostData.firstName,
        lastName:       hostData.lastName,
        phone:          hostData.phone,
        tenantName:     propertyData.tenantName,
        tenantSlug:     propertyData.tenantSlug,
        platformFeePct: propertyData.platformFeePct,
      }).unwrap();
      dispatch(setCredentials({
        user:         result.user as unknown as User,
        accessToken:  result.accessToken,
        refreshToken: result.refreshToken,
      }));
      showToast("Account created! Welcome to your dashboard.", "success");
      dispatch(resetOnboarding());
      navigate("/dashboard");
    } catch { /* errorMiddleware handles toast */ }
  };

  return {
    pendingEmail,
    hostData,
    handleInitiate,       initiating,
    handleConfirmOtp,     confirming,
    handleResend,         resending,
    handleGuestDetails,   guestReg,
    handleHostDetails,
    handleCreateProperty, hostReg,
  };
}