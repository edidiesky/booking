import { useEffect }   from "react";
import { useForm }     from "react-hook-form";
import { Input }       from "@/components/ui/input";
import type { Tenant, UpdateTenantSettingsPayload } from "@/types/api";

interface Props {
  tenant:   Tenant | undefined;
  onSave:   (d: UpdateTenantSettingsPayload) => Promise<void>;
  isSaving: boolean;
}

export default function TenantSettingsSection({ tenant, onSave, isSaving }: Props) {
  const { register, handleSubmit, reset } = useForm<UpdateTenantSettingsPayload>();

  useEffect(() => {
    if (tenant) reset({ timezone: tenant.settings.timezone, currency: tenant.settings.currency, locale: tenant.settings.locale });
  }, [tenant, reset]);

  return (
    <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4">
        <Input label="Timezone" placeholder="Africa/Lagos" {...register("timezone")} />
        <Input label="Currency" placeholder="NGN"          {...register("currency")} />
        <Input label="Locale"   placeholder="en-NG"        {...register("locale")}   />
      </div>
      <button type="submit" disabled={isSaving}
              className="h-10 px-6 rounded-full text-xs lg:text-smself-start transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}>
        {isSaving ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}