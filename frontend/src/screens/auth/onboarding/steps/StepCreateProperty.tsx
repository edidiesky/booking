import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input }       from "@/components/ui/input";
import { createPropertySchema, type CreatePropertyFormData } from "../schema/onboarding.schema";

interface Props {
  onSubmit:  (d: CreatePropertyFormData) => Promise<void>;
  isLoading: boolean;
}

export default function StepCreateProperty({ onSubmit, isLoading }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<CreatePropertyFormData>({ resolver: zodResolver(createPropertySchema) });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("tenantName", val);
    setValue(
      "tenantSlug",
      val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    );
  };

  const slug = watch("tenantSlug") ?? "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h4
          className="text-xl lg:text-2xl font-semibold"
          style={{ color: "var(--color-ink)" }}
        >
          Set up your property
        </h4>
        <p className="text-sm" style={{ color: "var(--color-muted-stone)" }}>
          You can always update these details in your dashboard.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="Property / business name"
          placeholder="Grand Hotel Lagos"
          error={errors.tenantName?.message}
          {...register("tenantName")}
          onChange={handleNameChange}
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label="URL slug"
            placeholder="grand-hotel-lagos"
            error={errors.tenantSlug?.message}
            {...register("tenantSlug")}
          />
          <p className="text-xs" style={{ color: "var(--color-muted-stone)" }}>
            Your booking page:{" "}
            <span style={{ color: "var(--color-ink)" }}>
              {slug || "your-property"}.bukkings.com
            </span>
          </p>
        </div>
      </div>

      <button
        type="submit" disabled={isLoading}
        className="w-full h-12 px-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex font-bold items-center justify-center text-sm transition-opacity hover:opacity-80"
        style={{ backgroundColor: "var(--color-primary)", color: "var(--color-canvas)" }}
      >
        {isLoading ? "Creating account..." : "Launch my property"}
      </button>
    </form>
  );
}