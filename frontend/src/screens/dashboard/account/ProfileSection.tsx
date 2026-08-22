import { useEffect }   from "react";
import { useForm }     from "react-hook-form";
import { Input }       from "@/components/ui/input";
import type { Profile, UpdateProfilePayload } from "@/types/api";

interface Props {
  profile:  Profile | undefined;
  onSave:   (d: UpdateProfilePayload) => Promise<void>;
  isSaving: boolean;
}

export default function ProfileSection({ profile, onSave, isSaving }: Props) {
  const { register, handleSubmit, reset } = useForm<{ displayName: string; bio: string }>({});

  useEffect(() => {
    if (profile) reset({ displayName: profile.displayName, bio: profile.bio ?? "" });
  }, [profile, reset]);

  return (
    <form onSubmit={handleSubmit((d) => onSave({ displayName: d.displayName, bio: d.bio }))}
          className="flex flex-col gap-4">
      <Input label="Display name" {...register("displayName")} />
      <div className="flex flex-col gap-1.5">
        <label className="text-xs" style={{ color: "var(--color-ink)" }}>Bio</label>
        <textarea rows={3} className="w-full border rounded-xl px-3 py-2.5 text-xs lg:text-[13px]   resize-none outline-none"
                  style={{ borderColor: "#e8e6e3", color: "var(--color-ink)" }}
                  {...register("bio")} />
      </div>
      <button type="submit" disabled={isSaving}
              className="h-10 px-6 rounded-full text-xs lg:text-[13px]   self-start transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}>
        {isSaving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}