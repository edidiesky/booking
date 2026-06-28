import { useDispatch, useSelector }       from "react-redux";
import { useLocation }                    from "react-router-dom";
import {
  selectOnboardingStep,
  selectOnboardingShowVerify,
  selectOnboardingPendingEmail,
  setOnboardingStep,
} from "@/redux/slices/authSlice";
import AuthLayout          from "@/components/common/AuthLayout";
import StepInitiate        from "./steps/StepInitiate";
import StepConfirmOtp      from "./steps/StepConfirmOtp";
import StepGuestDetails    from "./steps/StepGuestDetails";
import StepHostDetails     from "./steps/StepHostDetails";
import StepCreateProperty  from "./steps/StepCreateProperty";
import VerifyInterstitial  from "./steps/VerifyInterstitial";
import { useOnboarding, type UserChoice } from "./hooks/useOnboarding";

const GUEST_STEPS = ["Create account", "Verify email", "Your details"];
const HOST_STEPS  = ["Create account", "Verify email", "Your details", "Your property"];

export default function Onboarding() {
  const dispatch     = useDispatch();
  const location     = useLocation();
  const step         = useSelector(selectOnboardingStep);
  const showVerify   = useSelector(selectOnboardingShowVerify);
  const pendingEmail = useSelector(selectOnboardingPendingEmail);

  const userChoice: UserChoice =
    (location.state as { userChoice?: UserChoice } | null)?.userChoice ?? "guest";

  const {
    handleInitiate,       initiating,
    handleConfirmOtp,     confirming,
    handleResend,         resending,
    handleGuestDetails,   guestReg,
    handleHostDetails,
    handleCreateProperty, hostReg,
  } = useOnboarding(userChoice);
  if (showVerify) {
    return (
      <VerifyInterstitial
        email={pendingEmail}
        onContinue={() => dispatch(setOnboardingStep(2))}
        onResend={handleResend}
        isResending={resending}
      />
    );
  }

  const stepLabels = userChoice === "host" ? HOST_STEPS : GUEST_STEPS;

  return (
    <AuthLayout stepLabels={stepLabels} currentStep={step}>
      {step === 1 && (
        <StepInitiate onSubmit={handleInitiate} isLoading={initiating} />
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
        <StepCreateProperty onSubmit={handleCreateProperty} isLoading={hostReg} />
      )}

      {step > 1 && (
        <button
          onClick={() => dispatch(setOnboardingStep(step - 1))}
          className="mt-6 text-sm transition-opacity hover:opacity-60 flex items-center gap-1"
          style={{ color: "var(--color-muted-stone)" }}
        >
          ← Back
        </button>
      )}
    </AuthLayout>
  );
}