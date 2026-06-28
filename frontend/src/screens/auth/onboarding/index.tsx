import { useDispatch, useSelector }  from "react-redux";
import { selectOnboardingStep, selectOnboardingShowVerify,
         selectOnboardingPendingEmail, setOnboardingStep } from "@/redux/slices/authSlice";
import AuthLayout         from "@/components/common/AuthLayout";
import StepInitiate       from "./steps/StepInitiate";
import StepConfirmOtp     from "./steps/StepConfirmOtp";
import StepGuestDetails   from "./steps/StepGuestDetails";
import StepHostDetails    from "./steps/StepHostDetails";
import VerifyInterstitial from "./steps/VerifyInterstitial";
import { useOnboarding }  from "./hooks/useOnboarding";
import { useAppSelector } from "@/hooks/useAppSelector";

const GUEST_STEPS = ["Create account", "Verify email", "Your details"];
const HOST_STEPS  = ["Create account", "Verify email", "Your property"];

export default function Onboarding() {
  const dispatch      = useDispatch();
  const step          = useSelector(selectOnboardingStep);
  const showVerify    = useSelector(selectOnboardingShowVerify);
  const pendingEmail  = useSelector(selectOnboardingPendingEmail);
  const userChoice    = useAppSelector((s) => s.auth.onboardingPendingEmail ? "guest" : "guest") as "guest" | "host";

  const {
    handleInitiate, initiating,
    handleConfirmOtp, confirming,
    handleResend, resending,
    handleGuestDetails, guestReg,
    handleHostDetails, hostReg,
  } = useOnboarding();

  if (showVerify) {
    return (
      <VerifyInterstitial
        email={pendingEmail}
        onResend={handleResend}
        isResending={resending}
        onContinue={() => dispatch(setOnboardingStep(2))}
      />
    );
  }

  const stepLabels = userChoice === "host" ? HOST_STEPS : GUEST_STEPS;

  return (
    <AuthLayout stepLabels={stepLabels} currentStep={step}>
      {step === 1 && <StepInitiate onSubmit={handleInitiate} isLoading={initiating} />}
      {step === 2 && (
        <StepConfirmOtp
          email={pendingEmail}
          onSubmit={handleConfirmOtp}
          onResend={handleResend}
          isLoading={confirming}
          isResending={resending}
        />
      )}
      {step === 3 && userChoice === "host" && <StepHostDetails onSubmit={handleHostDetails} isLoading={hostReg} />}
      {step === 3 && userChoice === "guest" && <StepGuestDetails onSubmit={handleGuestDetails} isLoading={guestReg} />}
      {step > 1 && (
        <button onClick={() => dispatch(setOnboardingStep(step - 1))}
          className="mt-6 text-sm transition-opacity hover:opacity-60"
          style={{ color: "var(--color-muted-stone)" }}>
          ← Back
        </button>
      )}
    </AuthLayout>
  );
}