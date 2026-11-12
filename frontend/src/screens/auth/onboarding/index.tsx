import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectOnboardingStep,
  selectOnboardingShowVerify,
  selectOnboardingPendingEmail,
  setOnboardingStep,
  setOnboardingShowVerify,
} from "@/redux/slices/authSlice";
import AuthLayout from "@/components/common/AuthLayout";
import StepSelectUserType from "./steps/StepSelectUserType";
import StepInitiate from "./steps/StepInitiate";
import StepConfirmOtp from "./steps/StepConfirmOtp";
import StepGuestDetails from "./steps/StepGuestDetails";
import StepHostDetails from "./steps/StepHostDetails";
import StepCreateProperty from "./steps/StepCreateProperty";
import VerifyInterstitial from "./steps/VerifyInterstitial";
import { useOnboarding, type UserChoice } from "./hooks/useOnboarding";

const GUEST_STEPS = ["Create account", "Verify email", "Your details"];
const HOST_STEPS = [
  "Create account",
  "Verify email",
  "Your Personal Details",
  "Your Business Details",
];

export default function Onboarding() {
  const dispatch = useDispatch();
  const step = useSelector(selectOnboardingStep);
  const showVerify = useSelector(selectOnboardingShowVerify);
  const pendingEmail = useSelector(selectOnboardingPendingEmail);

  const [userChoice, setUserChoice] = useState<UserChoice | null>(null);

  const {
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
  } = useOnboarding();

  if (!userChoice) {
    return (
      <AuthLayout>
        <StepSelectUserType
          onSelect={(choice) => {
            setUserChoice(choice);
            dispatch(setOnboardingStep(1));
            dispatch(setOnboardingShowVerify(false));
          }}
        />
      </AuthLayout>
    );
  }

  if (showVerify) {
    return (
      <VerifyInterstitial
        email={pendingEmail}
        onContinue={() => {
          dispatch(setOnboardingShowVerify(false));
          dispatch(setOnboardingStep(2));
        }}
        onResend={handleResend}
        isResending={resending}
        stepLabels={userChoice === "host" ? HOST_STEPS : GUEST_STEPS}
        currentStep={2}
      />
    );
  }

  const stepLabels = userChoice === "host" ? HOST_STEPS : GUEST_STEPS;

  return (
    <AuthLayout stepLabels={stepLabels} currentStep={step}>
      {step === 1 && (
        <StepInitiate
          userChoice={userChoice}
          onSubmit={handleInitiate}
          isLoading={initiating}
        />
      )}

      {step === 2 && (
        <StepConfirmOtp
          email={pendingEmail}
          onSubmit={handleConfirmOtp}
          onResend={handleResend}
          isLoading={confirming}
          isResending={resending}
        />
      )}

      {step === 3 && userChoice === "guest" && (
        <StepGuestDetails onSubmit={handleGuestDetails} isLoading={guestReg} />
      )}

      {step === 3 && userChoice === "host" && (
        <StepHostDetails onSubmit={handleHostDetails} isLoading={false} />
      )}

      {step === 4 && userChoice === "host" && (
        <StepCreateProperty
          onSubmit={handleCreateProperty}
          isLoading={hostReg}
        />
      )}

      {step > 1 ? (
        <button
          type="button"
          onClick={() => dispatch(setOnboardingStep(step - 1))}
          className="mt-6 text-xs lg:text-[13px] transition-opacity hover:opacity-60 flex items-center gap-1"
          style={{ color: "var(--color-muted-stone)" }}
        >
          Back
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setUserChoice(null)}
          className="mt-6 text-xs lg:text-[13px] transition-opacity hover:opacity-60 flex items-center gap-1"
          style={{ color: "var(--color-muted-stone)" }}
        >
          Change account type
        </button>
      )}
    </AuthLayout>
  );
}