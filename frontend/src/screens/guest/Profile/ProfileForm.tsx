import { useEffect }   from "react";
import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }           from "zod";
import { Input }       from "@/components/ui/input";
import type { Profile, UpdateProfilePayload } from "@/types/api";

const schema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  bio:         z.string().optional(),
  city:        z.string().optional(),
  state:       z.string().optional(),
  country:     z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  profile:   Profile | undefined;
  onSubmit:  (d: UpdateProfilePayload) => Promise<void>;
  isSaving:  boolean;
}

export default function ProfileForm({ profile, onSubmit, isSaving }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName,
        bio:         profile.bio ?? "",
        city:        profile.address?.city    ?? "",
        state:       profile.address?.state   ?? "",
        country:     profile.address?.country ?? "",
      });
    }
  }, [profile, reset]);

  const handleSave = async (data: FormValues) => {
    await onSubmit({
      displayName: data.displayName,
      bio:         data.bio,
      address: {
        city:    data.city,
        state:   data.state,
        country: data.country,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(handleSave)} className="flex flex-col gap-5">
      <Input label="Display name" error={errors.displayName?.message} {...register("displayName")} />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs lg:text-smfont-medium" style={{ color: "var(--color-ink)" }}>Bio</label>
        <textarea
          rows={3}
          placeholder="Tell us a bit about yourself..."
          className="w-full border rounded-xl px-3 py-2.5 text-xs lg:text-smresize-none outline-none"
          style={{ borderColor: "#e8e6e3", color: "var(--color-ink)" }}
          {...register("bio")}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input label="City"    placeholder="Lagos"   {...register("city")}    />
        <Input label="State"   placeholder="Lagos"   {...register("state")}   />
        <Input label="Country" placeholder="Nigeria" {...register("country")} />
      </div>

      <button
        type="submit" disabled={isSaving}
        className="w-full h-11 rounded-full text-xs lg:text-smtransition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
      >
        {isSaving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}