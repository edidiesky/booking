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
  activeSegment: WizardStepId;
  stepTitle: string;
  headline: string;
  subcopy?: string;
  children: React.ReactNode;
  preview?: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
  footer?: React.ReactNode;
  hidePreview?: boolean;
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
  footer,
  hidePreview = false,
}: Props) {
  const activeIdx = segmentIndex(activeSegment);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f4f3f0] px-3 py-6 lg:py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[960px] bg-white rounded-2xl border border-[#e8e6e3] shadow-[0_8px_40px_rgba(23,25,28,0.06)] overflow-hidden flex flex-col"
      >
        <header className="flex items-center justify-between gap-4 px-5 lg:px-8 h-14 border-b border-[#eeecea]">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="h-7 w-7 rounded-lg bg-[#17191c] text-white text-xs font-semibold flex items-center justify-center">
              B
            </span>
            <span className="text-sm font-semibold tracking-tight text-[#17191c] hidden sm:inline">
              Bukking
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-xs overflow-x-auto">
            {WIZARD_STEPS.map((s, i) => {
              const done = i < activeIdx;
              const active = i === activeIdx;
              return (
                <div key={s.id} className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  {i > 0 && (
                    <span
                      className={`w-3 sm:w-5 h-px ${
                        done || active ? "bg-[#2563eb]" : "bg-[#e8e6e3]"
                      }`}
                    />
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-full transition-colors ${
                      active
                        ? "text-[#2563eb] font-medium"
                        : done
                          ? "text-[#17191c]"
                          : "text-[#a3a6af]"
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                        done
                          ? "bg-[#2563eb] text-white"
                          : active
                            ? "border-2 border-[#2563eb] bg-white"
                            : "border border-[#d4d2ce] bg-white"
                      }`}
                    >
                      {done ? <Check size={10} strokeWidth={3} /> : null}
                    </span>
                    <span className="hidden md:inline">{s.label}</span>
                  </span>
                </div>
              );
            })}
          </nav>

          <div className="w-14 sm:w-20" aria-hidden />
        </header>

        <div
          className={`flex-1 grid grid-cols-1 ${
            hidePreview ? "" : "lg:grid-cols-2"
          }`}
        >
          <div className="flex flex-col px-5 lg:px-8 py-6 lg:py-8 min-h-[420px]">
            <div className="mb-6">
              <p className="text-xs text-[#a3a6af] mb-1.5">{stepTitle}</p>
              <h1 className="text-[22px] lg:text-[26px] leading-[1.2] tracking-tight font-medium text-[#17191c]">
                {headline}
              </h1>
              {subcopy && (
                <p className="mt-1.5 text-sm text-[#777b86] max-w-md leading-relaxed">
                  {subcopy}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-4 flex-1">{children}</div>
          </div>

          {!hidePreview && (
            <div className="hidden lg:flex flex-col justify-center border-l border-[#eeecea] bg-[#fafaf8] px-8 py-8">
              <div className="rounded-xl border border-[#e8e6e3] bg-white p-5 shadow-sm min-h-[280px] flex flex-col">
                {preview ?? (
                  <p className="text-sm text-[#a3a6af] m-auto text-center">
                    Your workspace, shaped around your properties.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {(showBack && onBack) || footer ? (
          <footer className="flex items-center justify-between gap-3 px-5 lg:px-8 py-4 border-t border-[#eeecea] bg-white">
            {showBack && onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-[#777b86] hover:text-[#17191c] inline-flex items-center gap-1"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3">{footer}</div>
          </footer>
        ) : null}
      </motion.div>
    </div>
  );
}

export { WIZARD_STEPS };