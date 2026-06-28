import { Link }                     from "react-router-dom";
import { motion }                   from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { StepItem }            from "@/types/ui";

interface Props {
  children:     React.ReactNode;
  leftContent?: React.ReactNode;
  stepLabels?:  string[];
  currentStep?: number;
}

function StepChecklist({ steps }: { steps: StepItem[] }) {
  return (
    <div className="flex flex-col gap-1">
      {steps.map((step, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-2.5 px-3 rounded-[10px] transition-colors"
          style={{ backgroundColor: step.status === "active" ? "#f5f5f3" : "transparent" }}
        >
          {step.status === "done"   && <CheckCircle2 size={18} className="shrink-0" style={{ color: "var(--color-ink)" }} />}
          {step.status === "active" && <Loader2 size={18} className="shrink-0 animate-spin" style={{ color: "var(--color-ink)" }} />}
          {step.status === "pending"&& <Circle size={18} className="shrink-0" style={{ color: "#d1d5db" }} />}
          <span
            className="text-sm"
            style={{
              color:          step.status === "pending" ? "#9ca3af" : "var(--color-ink)",
              fontWeight:     step.status === "active"  ? 600 : 400,
              textDecoration: step.status === "done"    ? "line-through" : "none",
            }}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AuthLayout({ children, leftContent, stepLabels, currentStep }: Props) {
  const resolvedSteps: StepItem[] | null =
    stepLabels && currentStep != null
      ? stepLabels.map((label, i) => ({
          label,
          status: i + 1 < currentStep ? "done" : i + 1 === currentStep ? "active" : "pending",
        }))
      : null;

  const remaining = resolvedSteps?.filter((s) => s.status !== "done").length ?? null;

  return (
    <div className="min-h-screen grid lg:grid-cols-[400px_1fr]" style={{ backgroundColor: "var(--color-canvas)" }}>
      <div className="hidden lg:flex flex-col justify-between p-10" style={{ backgroundColor: "#FAF8F5" }}>
        <div className="flex flex-col gap-6">
          {resolvedSteps ? (
            <>
              <div className="flex flex-col gap-1">
                {leftContent ?? (
                  <>
                    <h2 className="text-[22px] font-semibold" style={{ color: "var(--color-ink)", letterSpacing: "-0.3px" }}>
                      Create Account
                    </h2>
                    {remaining != null && remaining > 0 && (
                      <p className="text-sm" style={{ color: "#6b7280" }}>
                        {remaining} step{remaining > 1 ? "s" : ""} remaining
                      </p>
                    )}
                  </>
                )}
              </div>
              <StepChecklist steps={resolvedSteps} />
            </>
          ) : (
            leftContent ?? (
              <div className="flex flex-col gap-4">
                <h2 className="text-[28px] font-semibold leading-[1.1]" style={{ color: "var(--color-ink)", letterSpacing: "-0.5px" }}>
                  Book your next stay.
                </h2>
                <p className="text-[15px] leading-relaxed" style={{ color: "#6b7280" }}>
                  Discover properties, make reservations, and manage your trips all in one place.
                </p>
              </div>
            )
          )}
        </div>
        <p className="text-xs" style={{ color: "#9ca3af" }}>
          © {new Date().getFullYear()} Booking Platform
        </p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12" style={{ backgroundColor: "#FAF8F5" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="text-base font-semibold mb-8 block lg:hidden" style={{ color: "var(--color-ink)" }}>
            Booking
          </Link>
          {children}
        </motion.div>
      </div>
    </div>
  );
}