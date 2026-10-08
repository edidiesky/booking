import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  businessSchema,
  type BusinessFormData,
} from "../schema/onboarding.schema";
import OnboardingShell from "../components/OnboardingShell";

const TYPES: { id: BusinessFormData["businessTypes"][number]; label: string }[] =
  [
    { id: "shortlet", label: "Shortlet" },
    { id: "hotel", label: "Hotel" },
    { id: "guesthouse", label: "Guesthouse" },
    { id: "apartment", label: "Apartment" },
    { id: "bnb", label: "BnB" },
    { id: "other", label: "Other" },
  ];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

interface Props {
  defaultValues?: Partial<BusinessFormData>;
  onContinue: (data: BusinessFormData) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function StepBusiness({
  defaultValues,
  onContinue,
  onBack,
  isLoading,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      tenantName: "",
      tenantSlug: "",
      businessTypes: [],
      city: "",
      website: "",
      ...defaultValues,
    },
  });

  const name = watch("tenantName");
  const slug = watch("tenantSlug");
  const types = watch("businessTypes") ?? [];
  const city = watch("city");

  const toggleType = (id: BusinessFormData["businessTypes"][number]) => {
    const next = types.includes(id)
      ? types.filter((t) => t !== id)
      : [...types, id];
    setValue("businessTypes", next, { shouldValidate: true });
  };

  return (
    <OnboardingShell
      activeSegment="business"
      stepTitle="Step 2 of 5 · Business"
      headline="Tell us about your business"
      subcopy="We'll use this to personalise your host workspace."
      onBack={onBack}
      preview={
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium text-[#a3a6af] uppercase tracking-wide">
            Your workspace
          </p>
          <div className="rounded-xl border border-[#e8e6e3] bg-[#fafaf9] p-4 flex flex-col gap-3">
            <div className="h-24 rounded-lg bg-[#eee] flex items-center justify-center text-[#a3a6af] text-xs">
              Preview
            </div>
            <p className="text-sm font-medium text-[#17191c]">
              {name || "Your business"}
            </p>
            <p className="text-xs text-[#777b86]">
              {city || "Location"} ·{" "}
              {types.length
                ? types.map((t) => TYPES.find((x) => x.id === t)?.label).join(", ")
                : "Property types"}
            </p>
            <p className="text-xs text-[#a3a6af]">
              {slug || "your-business"}.bukkings.com
            </p>
          </div>
          <p className="text-xs text-[#a3a6af]">
            Your workspace, shaped around your properties.
          </p>
        </div>
      }
    >
      <form
        onSubmit={handleSubmit(onContinue)}
        className="flex flex-col gap-5"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-[#777b86]">Business name</span>
          <input
            className="h-11 px-3 rounded-xl border border-[#e8e6e3] text-sm bg-white"
            placeholder="e.g. Lekki Heights Shortlets"
            {...register("tenantName", {
              onChange: (e) => {
                const v = e.target.value as string;
                if (!slug || slug === slugify(name)) {
                  setValue("tenantSlug", slugify(v));
                }
              },
            })}
          />
          {errors.tenantName && (
            <span className="text-xs text-red-600">{errors.tenantName.message}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-[#777b86]">Workspace URL</span>
          <div className="flex items-center gap-1">
            <input
              className="h-11 px-3 rounded-xl border border-[#e8e6e3] text-sm bg-white flex-1"
              placeholder="lekki-heights"
              {...register("tenantSlug")}
            />
            <span className="text-xs text-[#a3a6af] shrink-0">.bukkings.com</span>
          </div>
          {errors.tenantSlug && (
            <span className="text-xs text-red-600">{errors.tenantSlug.message}</span>
          )}
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-[#777b86]">Business type</span>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const on = types.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleType(t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    on
                      ? "bg-[#17191c] text-white border-[#17191c]"
                      : "bg-white text-[#4c4c4c] border-[#e8e6e3] hover:bg-[#f2f0ed]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          {errors.businessTypes && (
            <span className="text-xs text-red-600">
              {errors.businessTypes.message}
            </span>
          )}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-[#777b86]">Primary location</span>
          <input
            className="h-11 px-3 rounded-xl border border-[#e8e6e3] text-sm bg-white"
            placeholder="e.g. Lekki Phase 1, Lagos"
            {...register("city")}
          />
          {errors.city && (
            <span className="text-xs text-red-600">{errors.city.message}</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-[#777b86]">Website (optional)</span>
          <input
            className="h-11 px-3 rounded-xl border border-[#e8e6e3] text-sm bg-white"
            placeholder="https://"
            {...register("website")}
          />
          {errors.website && (
            <span className="text-xs text-red-600">{errors.website.message}</span>
          )}
        </label>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full text-sm font-medium text-white bg-[#2563eb] hover:opacity-90 disabled:opacity-50"
        >
          Continue
        </button>
      </form>
    </OnboardingShell>
  );
}
