import { useEffect }               from "react";
import { useForm, useFieldArray }  from "react-hook-form";
import { Plus, Trash2 }            from "lucide-react";
import type { Tenant, UpdateCancellationPolicyPayload } from "@/types/api";

interface FormValues {
  tiers: { hours_before: number; refund_pct: number }[];
}

interface Props {
  tenant:   Tenant | undefined;
  onSave:   (d: UpdateCancellationPolicyPayload) => Promise<void>;
  isSaving: boolean;
}

export default function CancellationPolicySection({ tenant, onSave, isSaving }: Props) {
  const { register, handleSubmit, control, reset } = useForm<FormValues>({
    defaultValues: { tiers: [{ hours_before: 48, refund_pct: 100 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "tiers" });

  useEffect(() => {
    if (tenant?.cancellationPolicy?.length) {
      reset({ tiers: tenant.cancellationPolicy });
    }
  }, [tenant, reset]);

  const submit = (d: FormValues) => onSave({ policy: d.tiers });

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {fields.map((field, i) => (
          <div key={field.id} className="flex items-center gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>
                Hours before check-in
              </label>
              <input type="number" className="h-9 border px-3 text-sm outline-none"
                     style={{ borderColor: "#e8e6e3", color: "var(--color-ink)" }}
                     {...register(`tiers.${i}.hours_before`, { valueAsNumber: true })} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>
                Refund %
              </label>
              <input type="number" min={0} max={100}
                     className="h-9 border px-3 text-sm outline-none"
                     style={{ borderColor: "#e8e6e3", color: "var(--color-ink)" }}
                     {...register(`tiers.${i}.refund_pct`, { valueAsNumber: true })} />
            </div>
            <button type="button" onClick={() => remove(i)}
                    className="mt-5 p-2 rounded-lg hover:bg-[#fee2e2] transition-colors">
              <Trash2 size={14} style={{ color: "#dc2626" }} />
            </button>
          </div>
        ))}
      </div>

      <button type="button"
              onClick={() => append({ hours_before: 24, refund_pct: 50 })}
              className="flex items-center gap-2 text-sm self-start transition-opacity hover:opacity-70"
              style={{ color: "var(--color-muted-stone)" }}>
        <Plus size={14} /> Add tier
      </button>

      <button type="submit" disabled={isSaving}
              className="h-10 px-6 rounded-full text-sm self-start transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}>
        {isSaving ? "Saving..." : "Save policy"}
      </button>
    </form>
  );
}