import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X } from "lucide-react";
import { slide } from "@/constants/framer";
import type { Role } from "@/types/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  roleId: z.string().uuid("Select a role"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  roles: Role[];
  onClose: () => void;
  onSubmit: (payload: { email: string; roleId: string }) => Promise<boolean>;
  isSaving: boolean;
}

const field =
  "w-full h-10 px-3 text-xs lg:text-[13px] border rounded-lg outline-none";
const fieldStyle = { borderColor: "#e8e6e3", color: "#17191c" };

export default function InviteMemberModal({
  roles,
  onClose,
  onSubmit,
  isSaving,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { roleId: roles[0]?.id ?? "" },
  });

  const submit = async (data: FormData) => {
    const ok = await onSubmit({
      email: data.email.trim(),
      roleId: data.roleId,
    });
    if (ok) {
      reset();
      onClose();
    }
  };

  return (
    <div className="h-[100vh] bg-[#16161639] inset-0 backdrop-blur-sm w-full fixed top-0 left-0 z-[5000] flex items-end md:items-center justify-end md:justify-center px-4">
      <motion.div
        variants={slide}
        initial="initial"
        animate="enter"
        exit="exit"
        className="w-full md:w-[480px] md:max-w-[520px] rounded-2xl pt-6 justify-between relative items-start flex flex-col gap-4 bg-white"
      >
        <div className="w-full flex px-8 items-start justify-between gap-1">
          <div>
            <h3 className="text-lg text-[#17191c]">Invite member</h3>
            <p className="text-xs lg:text-[13px] text-[#777b86] mt-1 max-w-[380px]">
              Send an email invitation with a role. They’ll join your workspace
              after accepting.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f2f0ed] transition-colors"
            aria-label="Close"
          >
            <X size={16} className="text-[#777b86]" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(submit)}
          className="w-full flex flex-col gap-4 px-8 pb-8"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "#777b86" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="colleague@company.com"
              {...register("email")}
              className={field}
              style={fieldStyle}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-[11px] text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "#777b86" }}>
              Role
            </label>
            <select
              {...register("roleId")}
              className={field}
              style={fieldStyle}
            >
              {roles.length === 0 && (
                <option value="">No roles available</option>
              )}
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.roleId && (
              <p className="text-[11px] text-red-600">
                {errors.roleId.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-full text-xs lg:text-[13px] border transition-opacity hover:opacity-80"
              style={{ borderColor: "#e8e6e3", color: "#17191c" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || roles.length === 0}
              className="h-9 px-5 rounded-full text-xs lg:text-[13px] text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: "#6d28d9" }}
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              Send invite
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
