import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }           from "zod";
import type { Role, AssignRolePayload } from "@/types/api";

const schema = z.object({
  userId:   z.string().uuid("Must be a valid user UUID"),
  roleSlug: z.enum(["host:admin", "host:staff", "host:inspector"]),
  reason:   z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  roles:    Role[];
  onClose:  () => void;
  onSubmit: (payload: AssignRolePayload) => Promise<boolean>;
  isSaving: boolean;
}

const field      = "w-full h-10 px-3 text-xs border rounded-lg outline-none";
const fieldStyle = { borderColor: "var(--color-fog)", color: "var(--color-ink)" };

export default function AssignRoleModal({ roles, onClose, onSubmit, isSaving }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver:      zodResolver(schema),
    defaultValues: { roleSlug: "host:staff" },
  });

  const submit = async (data: FormData) => {
    const ok = await onSubmit({ userId: data.userId, roleSlug: data.roleSlug, reason: data.reason });
    if (ok) { reset(); onClose(); }
  };

  // Only host roles are assignable — platform:admin and guest are system-only
  const assignable = roles.filter((r) =>
    ["host:admin", "host:staff", "host:inspector"].includes(r.slug)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="w-full max-w-md rounded-2xl p-8 flex flex-col gap-6"
           style={{ backgroundColor: "var(--color-canvas)" }}>

        <div className="flex items-center justify-between">
          <h2 className="text-sm " style={{ color: "var(--color-ink)" }}>Assign Role</h2>
          <button onClick={onClose} className="text-xl leading-none opacity-40 hover:opacity-100">×</button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "var(--color-muted-stone)" }}>User ID</label>
            <input {...register("userId")} className={field} style={fieldStyle}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            {errors.userId && <p className="text-xs text-red-500">{errors.userId.message}</p>}
            <p className="text-xs" style={{ color: "var(--color-muted-stone)" }}>
              Find user IDs from your backend audit logs or database.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "var(--color-muted-stone)" }}>Role</label>
            <select {...register("roleSlug")} className={field} style={fieldStyle}>
              {assignable.map((r) => (
                <option key={r.id} value={r.slug}>{r.name}</option>
              ))}
            </select>
            {errors.roleSlug && <p className="text-xs text-red-500">{errors.roleSlug.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "var(--color-muted-stone)" }}>
              Reason <span className="opacity-50">(optional)</span>
            </label>
            <input {...register("reason")} className={field} style={fieldStyle}
              placeholder="e.g. New property manager" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-full border text-xs transition-opacity hover:opacity-70"
              style={{ borderColor: "var(--color-fog)", color: "var(--color-muted-stone)" }}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="flex-1 h-10 rounded-full text-xs transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}>
              {isSaving ? "Assigning..." : "Assign Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}