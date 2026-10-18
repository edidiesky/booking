import { CheckCircle2 } from "lucide-react";
import OnboardingShell from "../components/OnboardingShell";
import type { BusinessFormData, WorkspaceFormData } from "../schema/onboarding.schema";
import type { PendingInvite } from "./StepTeam";

interface Props {
  business: BusinessFormData;
  workspace: WorkspaceFormData;
  invites: PendingInvite[];
  listingsPath: string;
  onDashboard: () => void;
}

export default function StepFinish({
  business,
  workspace,
  invites,
  listingsPath,
  onDashboard,
}: Props) {
  return (
    <OnboardingShell
      activeSegment="finish"
      stepTitle="Step 5 of 5 · Finish"
      headline="You're all set"
      subcopy="Your host workspace is ready. Let's get your properties organised."
      showBack={false}
      preview={
        <div className="rounded-xl border border-[#e8e6e3] p-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-[#17191c] text-white flex items-center justify-center text-xs font-medium">
              {business.tenantName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-[#17191c]">{business.tenantName}</p>
              <p className="text-xs text-[#777b86]">
                {business.city} · {workspace.currency}
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-[#777b86]">
            <span>
              Listings:{" "}
              {listingsPath === "csv"
                ? "Import ready"
                : listingsPath === "scratch"
                  ? "Add from dashboard"
                  : "Later"}
            </span>
            <span>{invites.length} invite(s)</span>
          </div>
          <span className="inline-flex text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
            Workspace ready
          </span>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center gap-4 py-6">
        <CheckCircle2 size={48} className="text-emerald-600" />
        <p className="text-sm text-[#777b86] max-w-sm">
          Account created for <strong className="text-[#17191c]">{business.tenantName}</strong>.
          You can import a CSV, add photos, and invite staff anytime from the
          dashboard.
        </p>
        <button
          type="button"
          onClick={onDashboard}
          className="w-full max-w-xs h-12 rounded-full text-sm font-medium text-white bg-[#2563eb] hover:opacity-90"
        >
          Go to dashboard
        </button>
      </div>
    </OnboardingShell>
  );
}