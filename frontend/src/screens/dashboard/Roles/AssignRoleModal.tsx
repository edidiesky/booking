import { motion }       from "framer-motion";
import { useForm }      from "react-hook-form";
import { zodResolver }  from "@hookform/resolvers/zod";
import { z }            from "zod";
import { Loader2 }      from "lucide-react";
import { slide }        from "@/constants/framer";
import type { Role, AssignRolePayload } from "@/types/api";

const schema = z.object({
  userId:   z.string().uuid("Must be a valid user UUID"),
  roleSlug: z.string().min(1, "Select a role"),
  reason:   z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  roles:    Role[];
  onClose:  () => void;
  onSubmit: (payload: AssignRolePayload) => Promise<boolean>;
  isSaving: boolean;
}

const field      = "w-full h-10 px-3 text-xs lg:text-sm border rounded-lg outline-none";
const fieldStyle = { borderColor: "#e8e6e3", color: "#17191c" };

export default function AssignRoleModal({ roles, onClose, onSubmit, isSaving }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver:      zodResolver(schema),
    defaultValues: { roleSlug: roles[0]?.slug ?? "" },
  });

  const submit = async (data: FormData) => {
    const ok = await onSubmit({ userId: data.userId, roleSlug: data.roleSlug, reason: data.reason });
    if (ok) { reset(); onClose(); }
  };

  return (
    <div className="h-[100vh] bg-[#16161639] inset-0 backdrop-blur-sm w-full fixed top-0 left-0 z-[5000] flex items-end md:items-center justify-end md:justify-center px-4">
      <motion.div
        variants={slide}
        initial="initial"
        animate="enter"
        exit="exit"
        className="w-full md:w-[500px] md:max-w-[550px] rounded-2xl pt-6 justify-between relative items-start flex flex-col gap-4 bg-white"
      >
        <div className="w-full flex px-8 items-start justify-between gap-1">
          <div>
            <h3 className="text-lg text-[#17191c]">Assign Role</h3>
            <p className="text-xs lg:text-sm text-[#777b86] mt-1 max-w-[380px]">
              Grant a team member one of your tenant's roles.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(submit)} className="w-full flex flex-col gap-4 px-8">
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "#777b86" }}>User ID</label>
            <input {...register("userId")} className={field} style={fieldStyle}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            {errors.userId && <p className="text-xs lg:text-smtext-red-500">{errors.userId.message}</p>}
            <p className="text-xs" style={{ color: "#777b86" }}>
              Find user IDs from your backend audit logs or database.
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "#777b86" }}>Role</label>
            <select {...register("roleSlug")} className={field} style={fieldStyle}>
              {roles.map((r) => (
                <option key={r.id} value={r.slug}>{r.name}</option>
              ))}
            </select>
            {errors.roleSlug && <p className="text-xs lg:text-smtext-red-500">{errors.roleSlug.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "#777b86" }}>
              Reason <span className="opacity-50">(optional)</span>
            </label>
            <input {...register("reason")} className={field} style={fieldStyle}
              placeholder="e.g. New property manager" />
          </div>
        </form>

        <div className="w-full flex px-8 py-4 border-t border-[#e8e6e3] bg-white items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-9 px-5 text-xs lg:text-sm rounded-full text-[#4c4c4c] border border-[#e8e6e3] hover:bg-[#f2f0ed] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(submit)}
            disabled={isSaving}
            className="h-9 px-5 text-xs lg:text-sm rounded-full bg-[#17191c] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Assigning...
              </>
            ) : "Assign Role"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}