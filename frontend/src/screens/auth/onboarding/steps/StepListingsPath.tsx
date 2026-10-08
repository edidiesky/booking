
import { useState } from "react";
import { FileSpreadsheet, Sparkles, Clock } from "lucide-react";
import OnboardingShell from "../components/OnboardingShell";
import type { ListingsPathFormData } from "../schema/onboarding.schema";

interface Props {
  onContinue: (path: ListingsPathFormData["path"]) => void;
  onBack: () => void;
  onSkip: () => void;
  onStartCsv?: () => void;
}

const OPTIONS: {
  id: ListingsPathFormData["path"];
  title: string;
  body: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "scratch",
    title: "I'm starting from scratch",
    body: "New host or no spreadsheet yet. Add properties from the dashboard when you're ready.",
    icon: <Sparkles size={18} />,
  },
  {
    id: "csv",
    title: "I already have a property list",
    body: "Bring an existing CSV or Excel file. We'll create properties and room types for you.",
    icon: <FileSpreadsheet size={18} />,
  },
  {
    id: "later",
    title: "I'll do this later",
    body: "Skip for now and set up listings from your dashboard anytime.",
    icon: <Clock size={18} />,
  },
];

export default function StepListingsPath({
  onContinue,
  onBack,
  onSkip,
  onStartCsv,
}: Props) {
  const [selected, setSelected] = useState<ListingsPathFormData["path"]>("scratch");

  const handleContinue = () => {
    if (selected === "csv" && onStartCsv) {
      onStartCsv();
      return;
    }
    onContinue(selected);
  };

  return (
    <OnboardingShell
      activeSegment="listings"
      stepTitle="Step 3 of 5 · Listings"
      headline="How do you add properties?"
      subcopy="Pick what fits. You won't need to enter everything now — CSV import is optional."
      onBack={onBack}
      preview={
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-[#a3a6af] uppercase tracking-wide">
            Spreadsheet → workspace
          </p>
          <div className="rounded-xl border border-dashed border-[#e8e6e3] p-4 text-xs text-[#777b86] space-y-2">
            <p>
              Columns like <code className="text-[#17191c]">property_ref</code>,{" "}
              <code className="text-[#17191c]">room_ref</code>, price, and
              amenities map automatically.
            </p>
            <p>Photos can be added after import using:</p>
            <p className=" text-[#17191c]">
              PROPERTY__ROOM__1.jpg
            </p>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt) => {
          const on = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              className={`text-left rounded-2xl border p-4 flex gap-3 transition-colors ${
                on
                  ? "border-[#2563eb] bg-[#eff6ff]"
                  : "border-[#e8e6e3] bg-white hover:bg-[#fafaf9]"
              }`}
            >
              <span
                className={`mt-0.5 ${on ? "text-[#2563eb]" : "text-[#a3a6af]"}`}
              >
                {opt.icon}
              </span>
              <span>
                <span className="block text-sm font-medium text-[#17191c]">
                  {opt.title}
                </span>
                <span className="block text-xs text-[#777b86] mt-1">
                  {opt.body}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleContinue}
        className="w-full h-12 rounded-full text-sm font-medium text-white bg-[#2563eb] hover:opacity-90"
      >
        Continue
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="w-full text-xs text-[#777b86] hover:text-[#17191c]"
      >
        I&apos;ll do this later
      </button>
    </OnboardingShell>
  );
}
