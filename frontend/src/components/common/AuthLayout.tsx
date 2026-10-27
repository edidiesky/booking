import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { StepItem } from "@/types/ui";

interface Props {
  children: React.ReactNode;
  leftContent?: React.ReactNode;
  stepLabels?: string[];
  currentStep?: number;
  sidebarTitle?: string;
  brandName?: string;
}

function StepChecklist({ steps }: { steps: StepItem[] }) {
  return (
    <nav className="flex flex-col gap-0" aria-label="Progress">
      {steps.map((step, i) => {
        const isDone = step.status === "done";
        const isActive = step.status === "active";

        return (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <span
              className={`
                flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2
                ${
                  isDone
                    ? "border-[#c5c9d1] bg-[#c5c9d1] text-white"
                    : isActive
                      ? "border-[#1a56ff] bg-[#1a56ff]"
                      : "border-[#d8dce3] bg-transparent"
                }
              `}
              aria-hidden
            >
              {isDone ? <Check size={11} strokeWidth={3} /> : null}
            </span>

            <span
              className={`text-sm font-bold leading-none ${
                isDone
                  ? "text-[#a3a8b3] line-through decoration-[#a3a8b3]"
                  : isActive
                    ? "text-[#17191c]"
                    : "text-[#17191c]"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

export default function AuthLayout({
  children,
  leftContent,
  stepLabels,
  currentStep,
  sidebarTitle = "Create Account",
  brandName = "Bukking",
}: Props) {
  const resolvedSteps: StepItem[] | null =
    stepLabels && currentStep != null
      ? stepLabels.map((label, i) => ({
          label,
          status:
            i + 1 < currentStep
              ? "done"
              : i + 1 === currentStep
                ? "active"
                : "pending",
        }))
      : null;

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-[1280px] mx-auto grid lg:grid-cols-[minmax(480px,460px)_1fr]">
        
           <aside className="hidden lg:flex flex-col justify-between items-center px-10 py-10 bg-white">
        <div className="flex flex-col gap-6">
          <Link
            to="/"
            className="text-[22px] font-semibold tracking-tight text-[#17191c]"
          >
            {brandName}
          </Link>

          {resolvedSteps ? (
            <div className="flex flex-col gap-6">
              {leftContent ?? (
                <h1 className="text-xl lg:text-xl font-semibold tracking-tight text-[#17191c] leading-tight">
                  {sidebarTitle}
                </h1>
              )}
              <StepChecklist steps={resolvedSteps} />
            </div>
          ) : (
            (leftContent ?? (
              <div className="flex flex-col gap-3 max-w-[280px]">
                <h1 className="text-xl lg:text-2xl font-semibold tracking-tight text-[#17191c] leading-tight">
                  Book your next stay
                </h1>
                <p className="text-[15px] text-[#777b86] leading-relaxed">
                  Discover properties, make reservations, and manage trips in
                  one place.
                </p>
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-[#a3a8b3]">
          © {new Date().getFullYear()} {brandName}. All rights reserved.
        </p>
      </aside>

      <div className="flex flex-col min-h-screen">
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-[#eeecea]">
          <Link to="/" className="text-lg font-semibold text-[#17191c]">
            {brandName}
          </Link>
        </div>

        {resolvedSteps && (
          <div className="lg:hidden px-5 py-3 border-b border-[#eeecea] overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              {resolvedSteps.map((s, i) => (
                <span
                  key={i}
                  className={`text-xs px-2.5 py-1 rounded-full ${
                    s.status === "active"
                      ? "bg-[#1a56ff] text-white"
                      : s.status === "done"
                        ? "bg-[#eef0f3] text-[#777b86]"
                        : "text-[#a3a8b3]"
                  }`}
                >
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-1 items-start justify-start px-5 py-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-[420px]"
          >
            {children}
          </motion.div>
        </div>
      </div>
        </div>
   
    </div>
  );
}
