import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export type WizardStepId =
  | "account"
  | "business"
  | "listings"
  | "team"
  | "finish";

const WIZARD_STEPS: { id: WizardStepId; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "business", label: "Business" },
  { id: "listings", label: "Listings" },
  { id: "team", label: "Team" },
  { id: "finish", label: "Finish" },
];

interface Props {
  /** High-level wizard segment (progress header) */
  activeSegment: WizardStepId;
  /** Sub-step label e.g. "Step 2 of 5 · Business" */
  stepTitle: string;
  headline: string;
  subcopy?: string;
  children: React.ReactNode;
  /** Right-hand preview panel */
  preview?: React.ReactNode;
  onBack?: () => void;
  /** Hide back on first screen */
  showBack?: boolean;
}

function segmentIndex(id: WizardStepId): number {
  return WIZARD_STEPS.findIndex((s) => s.id === id);
}

export default function OnboardingShell({
  activeSegment,
  stepTitle,
  headline,
  subcopy,
  children,
  preview,
  onBack,
  showBack = true,
}: Props) {
  const activeIdx = segmentIndex(activeSegment);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#f7f6f3]">
      {/* Top bar */}
      <header className="w-full border-b border-[#e8e6e3] bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span
              className="text-base font-semibold tracking-tight"
              style={{ color: "var(--color-ink, #17191c)" }}
            >
              Bukking
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 text-xs">
            {WIZARD_STEPS.map((s, i) => {
              const done = i < activeIdx;
              const active = i === activeIdx;
              return (
                <div key={s.id} className="flex items-center gap-1">
                  {i > 0 && (
                    <span className="w-4 h-px bg-[#e8e6e3] mx-0.5" />
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                      active
                        ? "bg-[#17191c] text-white"
                        : done
                          ? "text-[#17191c]"
                          : "text-[#a3a6af]"
                    }`}
                  >
                    {done && <Check size={12} strokeWidth={3} />}
                    {s.label}
                  </span>
                </div>
              );
            })}
          </nav>

          <Link
            to="/login"
            className="text-xs text-[#777b86] hover:text-[#17191c] shrink-0"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-stretch justify-center px-4 py-8 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12"
        >
          {/* Form column */}
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs text-[#a3a6af] mb-2">{stepTitle}</p>
              <h1
                className="text-[28px] lg:text-[32px] leading-[1.15] tracking-tight"
                style={{ color: "var(--color-ink, #17191c)" }}
              >
                {headline}
              </h1>
              {subcopy && (
                <p className="mt-2 text-sm text-[#777b86] max-w-md">{subcopy}</p>
              )}
            </div>

            <div className="flex flex-col gap-5">{children}</div>

            {showBack && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="self-start text-xs text-[#777b86] hover:text-[#17191c]"
              >
                ← Back
              </button>
            )}
          </div>

          {/* Preview column */}
          <div className="hidden lg:flex flex-col justify-center">
            <div className="rounded-2xl border border-[#e8e6e3] bg-white p-6 shadow-sm min-h-[320px]">
              {preview ?? (
                <p className="text-sm text-[#a3a6af]">
                  Your workspace, shaped around your properties.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export { WIZARD_STEPS };