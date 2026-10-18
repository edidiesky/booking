import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  workspaceSchema,
  type WorkspaceFormData,
  type BusinessFormData,
} from "../schema/onboarding.schema";
import OnboardingShell from "../components/OnboardingShell";

interface Props {
  business: BusinessFormData;
  defaultValues?: Partial<WorkspaceFormData>;
  onContinue: (data: WorkspaceFormData) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function StepWorkspace({
  business,
  defaultValues,
  onContinue,
  onBack,
  isLoading,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      country: "Nigeria",
      currency: "NGN",
      timezone: "Africa/Lagos",
      phone: "",
      address: "",
      ...defaultValues,
    },
  });

  const currency = watch("currency");
  const country = watch("country");

  return (
    <OnboardingShell
      activeSegment="business"
      stepTitle="Step 2 of 5 · Business"
      headline="Set up your workspace"
      subcopy="A few local defaults so prices, receipts and alerts look right."
      onBack={onBack}
      preview={
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-xs font-medium text-[#a3a6af] uppercase tracking-wide">
            {business.tenantName}
          </p>
          <div className="rounded-xl border border-[#e8e6e3] p-4 bg-[#fafaf9] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#777b86]">Currency</span>
              <span className="text-[#17191c]">{currency}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#777b86]">Country</span>
              <span className="text-[#17191c]">{country}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#777b86]">URL</span>
              <span className="text-[#17191c]">
                {business.tenantSlug}.bukkings.com
              </span>
            </div>
          </div>
          <p className="text-xs text-[#a3a6af]">
            Naira pricing and WAT timezone work out of the box for Nigeria.
          </p>
        </div>
      }
    >
      <form
        onSubmit={handleSubmit(onContinue)}
        className="flex flex-col gap-5"
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-[#777b86]">Country</span>
            <select
              className="h-11 px-3 rounded-xl border border-[#e8e6e3] text-sm bg-white"
              {...register("country")}
            >
              <option value="Nigeria">Nigeria</option>
              <option value="Ghana">Ghana</option>
              <option value="Kenya">Kenya</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-[#777b86]">Currency</span>
            <select
              className="h-11 px-3 rounded-xl border border-[#e8e6e3] text-sm bg-white"
              {...register("currency")}
            >
              <option value="NGN">NGN — Nigerian Naira</option>
              <option value="GHS">GHS — Ghana Cedi</option>
              <option value="KES">KES — Kenya Shilling</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-[#777b86]">Business address (optional)</span>
          <input
            className="h-11 px-3 rounded-xl border border-[#e8e6e3] text-sm bg-white"
            placeholder="Street, area, city"
            {...register("address")}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-[#777b86]">Phone</span>
            <input
              className="h-11 px-3 rounded-xl border border-[#e8e6e3] text-sm bg-white"
              placeholder="+234..."
              {...register("phone")}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-[#777b86]">Timezone</span>
            <select
              className="h-11 px-3 rounded-xl border border-[#e8e6e3] text-sm bg-white"
              {...register("timezone")}
            >
              <option value="Africa/Lagos">West Africa Time</option>
              <option value="Africa/Accra">Ghana Time</option>
              <option value="Africa/Nairobi">East Africa Time</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
        </div>

        {(errors.country || errors.currency || errors.timezone) && (
          <p className="text-xs text-red-600">Please complete required fields.</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full text-sm font-medium text-white bg-[#2563eb] hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "Creating workspace…" : "Continue"}
        </button>
      </form>
    </OnboardingShell>
  );
}