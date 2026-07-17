import { useState }                      from "react";
import { useDispatch, useSelector }       from "react-redux";
import {
  selectOnboardingStep,
  selectOnboardingShowVerify,
  selectOnboardingPendingEmail,
  setOnboardingStep,
  setOnboardingShowVerify,
} from "@/redux/slices/authSlice";
import AuthLayout            from "@/components/common/AuthLayout";
import StepSelectUserType    from "./steps/StepSelectUserType";
import StepInitiate          from "./steps/StepInitiate";
import StepConfirmOtp        from "./steps/StepConfirmOtp";
import StepGuestDetails      from "./steps/StepGuestDetails";
import StepHostDetails       from "./steps/StepHostDetails";
import StepCreateProperty    from "./steps/StepCreateProperty";
import VerifyInterstitial    from "./steps/VerifyInterstitial";
import { useOnboarding, type UserChoice } from "./hooks/useOnboarding";

const GUEST_STEPS = ["Create account", "Verify email", "Your details"];
const HOST_STEPS  = ["Create account", "Verify email", "Your details", "Your property"];

export default function Onboarding() {
  const dispatch     = useDispatch();
  const step         = useSelector(selectOnboardingStep);
  const showVerify   = useSelector(selectOnboardingShowVerify);
  const pendingEmail = useSelector(selectOnboardingPendingEmail);

  const [userChoice, setUserChoice] = useState<UserChoice | null>(null);

  const {
    handleInitiate,       initiating,
    handleConfirmOtp,     confirming,
    handleResend,         resending,
    handleGuestDetails,   guestReg,
    handleHostDetails,
    handleCreateProperty, hostReg,
  } = useOnboarding(userChoice ?? "guest");

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

  //  Verify interstitial (between step 1 and 2) 
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
      />
    );
  }

  const stepLabels = userChoice === "host" ? HOST_STEPS : GUEST_STEPS;

  return (
    <AuthLayout stepLabels={stepLabels} currentStep={step}>
      {/* Step 1 email + password */}
      {step === 1 && (
        <StepInitiate onSubmit={handleInitiate} isLoading={initiating} />
      )}

      {/* Step 2 OTP confirmation */}
      {step === 2 && (
        <StepConfirmOtp
          email={pendingEmail}
          onSubmit={handleConfirmOtp}
          onResend={handleResend}
          isLoading={confirming}
          isResending={resending}
        />
      )}

      {/* Step 3 guest profile details */}
      {step === 3 && userChoice === "guest" && (
        <StepGuestDetails onSubmit={handleGuestDetails} isLoading={guestReg} />
      )}

      {/* Step 3 host personal details */}
      {step === 3 && userChoice === "host" && (
        <StepHostDetails onSubmit={handleHostDetails} isLoading={false} />
      )}

      {/* Step 4 host property/tenant setup */}
      {step === 4 && userChoice === "host" && (
        <StepCreateProperty onSubmit={handleCreateProperty} isLoading={hostReg} />
      )}

      {/* Back button go to previous step, or back to user-type picker at step 1 */}
      {step > 1 ? (
        <button
          onClick={() => dispatch(setOnboardingStep(step - 1))}
          className="mt-6 text-xs transition-opacity hover:opacity-60 flex items-center gap-1"
          style={{ color: "var(--color-muted-stone)" }}
        >
          ← Back
        </button>
      ) : (
        <button
          onClick={() => setUserChoice(null)}
          className="mt-6 text-xs transition-opacity hover:opacity-60 flex items-center gap-1"
          style={{ color: "var(--color-muted-stone)" }}
        >
          ← Change account type
        </button>
      )}
    </AuthLayout>
  );
}