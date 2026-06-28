import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 }   from "lucide-react";
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1
          className="text-[28px] leading-[1.1]"
          style={{ color: "var(--color-ink)", letterSpacing: "-0.5px" }}
        >
          Set up your property
        </h1>
        <p className="text-[15px]" style={{ color: "var(--color-muted-stone)" }}>
          You can always update these details in your dashboard.
        </p>
      </div>

      <div
        className="w-12 h-12 rounded-[12px] flex items-center justify-center"
        style={{ backgroundColor: "var(--color-warm-mist)" }}
      >
        <Building2 size={20} style={{ color: "var(--color-terracotta)" }} />
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
              {slug || "your-property"}.bookingplatform.com
            </span>
          </p>
        </div>
      </div>

      <button
        type="submit" disabled={isLoading}
        className="w-full h-12 rounded-full flex items-center justify-center text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
      >
        {isLoading ? "Creating account..." : "Launch my property"}
      </button>
    </form>
  );
}