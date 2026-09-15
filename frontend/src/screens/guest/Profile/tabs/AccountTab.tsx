// import { useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { Input } from "@/components/ui/input";
// import type { Profile, User, UpdateProfilePayload } from "@/types/api";

// interface Props {
//   user: User;
//   profile: Profile | undefined;
//   onSave: (d: UpdateProfilePayload) => Promise<void>;
//   isSaving: boolean;
// }

// type FormValues = {
//   displayName: string;
//   phone: string;
//   bio: string;
//   street: string;
//   city: string;
//   state: string;
//   country: string;
// };

// export default function AccountTab({ user, profile, onSave, isSaving }: Props) {
//   const { register, handleSubmit, reset } = useForm<FormValues>({
//     defaultValues: {
//       displayName: "",
//       phone: "",
//       bio: "",
//       street: "",
//       city: "",
//       state: "",
//       country: "",
//     },
//   });

//   useEffect(() => {
//     if (!profile) return;
//     reset({
//       displayName: profile.displayName ?? "",
//       phone: profile.phone ?? "",
//       bio: profile.bio ?? "",
//       street: profile.address?.street ?? "",
//       city: profile.address?.city ?? "",
//       state: profile.address?.state ?? "",
//       country: profile.address?.country ?? "",
//     });
//   }, [profile, reset]);

//   const submit = async (d: FormValues) => {
//     await onSave({
//       displayName: d.displayName.trim() || undefined,
//       phone: d.phone.trim() || undefined,
//       bio: d.bio.trim() || undefined,
//       address: {
//         street: d.street.trim() || undefined,
//         city: d.city.trim() || undefined,
//         state: d.state.trim() || undefined,
//         country: d.country.trim() || undefined,
//       },
//     });
//   };

//   return (
//     <form
//       onSubmit={handleSubmit(submit)}
//       className="flex flex-col gap-5 max-w-xl"
//     >
//       <div>
//         <h3 className="text-sm lg:text-base font-medium text-[#17191c]">
//           Personal details
//         </h3>
//         <p className="text-xs mt-1 text-[#777b86]">
//           This is how you appear to hosts and support when you book a stay.
//         </p>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//         <Input label="Display name" {...register("displayName")} />
//         <Input label="Phone" placeholder="+234..." {...register("phone")} />
//       </div>

//       <Input label="Email" value={user.email} disabled />

//       <div className="flex flex-col gap-1.5">
//         <label className="text-xs" style={{ color: "var(--color-ink)" }}>
//           Bio
//         </label>
//         <textarea
//           rows={3}
//           className="w-full border rounded-xl px-3 py-2.5 text-xs lg:text-[13px] resize-none outline-none"
//           style={{ borderColor: "#e8e6e3", color: "var(--color-ink)" }}
//           placeholder="Tell hosts a little about yourself (optional)"
//           {...register("bio")}
//         />
//       </div>

//       <div>
//         <p className="text-xs font-medium text-[#17191c] mb-2">
//           Address (optional)
//         </p>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <div className="sm:col-span-2">
//             <Input label="Street" {...register("street")} />
//           </div>
//           <Input label="City" {...register("city")} />
//           <Input label="State" {...register("state")} />
//           <Input label="Country" {...register("country")} />
//         </div>
//       </div>

//       <button
//         type="submit"
//         disabled={isSaving}
//         className="h-10 px-6 rounded-full text-xs lg:text-[13px] self-start transition-opacity hover:opacity-80 disabled:opacity-50"
//         style={{
//           backgroundColor: "var(--color-ink)",
//           color: "var(--color-canvas)",
//         }}
//       >
//         {isSaving ? "Saving..." : "Save changes"}
//       </button>
//     </form>
//   );
// }


import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  label: string;
  value: string | null;
  placeholder: string;
  description?: string;
  editable: boolean;
  isActive: boolean;
  isSaving: boolean;
  onActivate: () => void;
  onCancel: () => void;
  onSave: (newValue: string) => void;
}

export default function SettingsRow({
  label, value, placeholder, description,
  editable, isActive, isSaving,
  onActivate, onCancel, onSave,
}: Props) {
  const [draft, setDraft] = useState(value ?? "");

  useEffect(() => {
    if (isActive) setDraft(value ?? "");
  }, [isActive, value]);

  return (
    <div className="py-5 border-b last:border-0" style={{ borderColor: "#f2f0ed" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[15px] ${isActive ? "font-semibold" : "font-normal"} text-[#17191c]`}>
            {label}
          </p>
          {!isActive && (
            <p className="text-[14px] text-[#4c4c4c] mt-0.5">
              {value || <span className="text-[#a3a6af]">{placeholder}</span>}
            </p>
          )}
        </div>
        {editable && (
          <button
            type="button"
            onClick={isActive ? onCancel : onActivate}
            className="text-sm underline text-[#17191c] shrink-0"
          >
            {isActive ? "Cancel" : value ? "Edit" : "Add"}
          </button>
        )}
      </div>

      {isActive && (
        <div className="mt-3 flex flex-col gap-3">
          {description && <p className="text-[13px] text-[#777b86]">{description}</p>}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className="w-full h-12 px-4 rounded-xl border text-[15px] outline-none"
            style={{ borderColor: "#c4c6ce" }}
            autoFocus
          />
          <button
            type="button"
            onClick={() => onSave(draft)}
            disabled={isSaving}
            className="h-11 px-6 rounded-lg text-[14px] font-medium text-white self-start disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: "#17191c" }}
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            Save
          </button>
        </div>
      )}
    </div>
  );
}