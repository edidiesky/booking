import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input }       from "@/components/ui/input";
import { hostDetailsSchema, type HostDetailsFormData } from "../schema/onboarding.schema";

interface Props {
  onSubmit:  (d: HostDetailsFormData) => void;
  isLoading: boolean;
}

export default function StepHostDetails({ onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<HostDetailsFormData>({
    resolver: zodResolver(hostDetailsSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3
          className="text-[28px] "
          style={{ color: "var(--color-ink)", letterSpacing: "-0.5px" }}
        >
          Your details
        </h3>
        <p className="text-[15px]" style={{ color: "var(--color-muted-stone)" }}>
          We'll use this for your host profile.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First name" placeholder="Ada"
          error={errors.firstName?.message} {...register("firstName")}
        />
        <Input
          label="Last name" placeholder="Obi"
          error={errors.lastName?.message}  {...register("lastName")}
        />
      </div>

      <Input
        label="Phone number (optional)" placeholder="+2348012345678"
        error={errors.phone?.message} {...register("phone")}
      />

      <button
        type="submit" disabled={isLoading}
        className="w-full h-12 rounded-full flex items-center justify-center text-xs lg:text-[13px]   transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
      >
        Continue →
      </button>
    </form>
  );
}