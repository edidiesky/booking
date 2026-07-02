import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { CreatePropertyPayload } from "@/types/api";
import { ChartSelect } from "@/components/common/charts/Chartselect";
const schema = z.object({
  name: z.string().min(3, "Min 3 characters"),
  description: z.string().optional(),
  propertyType: z.enum(["shortlet", "hotel", "guesthouse"]),
  street: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  onClose: () => void;
  onSubmit: (payload: CreatePropertyPayload) => Promise<boolean>;
  isSaving: boolean;
}

const PROPERTY_OPTIONS = [
  { value: "shortlet", label: "Shortlet" },
  { value: "hotel", label: "Hotel" },
  { value: "guesthouse", label: "Guesthouse" },
];

const field = "w-full h-10 px-3 text-sm border rounded-lg outline-none";
const fieldStyle = {
  borderColor: "var(--color-fog)",
  color: "var(--color-ink)",
};

export default function CreatePropertyModal({
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
    defaultValues: { propertyType: "shortlet", country: "Nigeria" },
  });

  const submit = async (data: FormData) => {
    const ok = await onSubmit({
      name: data.name,
      description: data.description ?? "",
      property_type: data.propertyType,
      address: {
        street: data.street,
        city: data.city,
        state: data.state,
        country: data.country,
      },
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
    });
    if (ok) {
      reset();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-8 flex flex-col gap-6 overflow-y-auto max-h-[90vh]"
        style={{ backgroundColor: "var(--color-canvas)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg " style={{ color: "var(--color-ink)" }}>
            Add Property
          </h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none opacity-40 hover:opacity-100"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs"
              style={{ color: "var(--color-muted-stone)" }}
            >
              Property Name
            </label>
            <input
              {...register("name")}
              className={field}
              style={fieldStyle}
              placeholder="e.g. Lekki Heights Shortlet"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#17191c]">Property Type</label>
            <ChartSelect
                        {...register("propertyType")}
                        options={PROPERTY_OPTIONS}
                      />
            {/* <Select {...register("propertyType")}>
              <SelectTrigger className="h-[42px] border border-[#e8e6e3] px-3 text-sm outline-none focus:border-[#17191c] transition-colors bg-white text-[#17191c] w-full rounded-none shadow-none focus:ring-0">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[#e8e6e3] shadow-sm rounded-xl">
                {[
                  { value: "shortlet", label: "Shortlet" },
                  { value: "hotel", label: "Hotel" },
                  { value: "guesthouse", label: "Guesthouse" },
                ].map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-sm text-[#17191c] cursor-pointer hover:bg-[#f2f0ed] focus:bg-[#f2f0ed] focus:text-[#17191c]"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs"
              style={{ color: "var(--color-muted-stone)" }}
            >
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none resize-none"
              style={fieldStyle}
              placeholder="Brief description of your property"
            />
          </div>

          {/* Address */}
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["street", "Street", "5 Admiralty Way"],
                ["city", "City", "Lagos"],
                ["state", "State", "Lagos"],
                ["country", "Country", "Nigeria"],
              ] as const
            ).map(([key, label, ph]) => (
              <div key={key} className="flex flex-col gap-1">
                <label
                  className="text-xs"
                  style={{ color: "var(--color-muted-stone)" }}
                >
                  {label}
                </label>
                <input
                  {...register(key)}
                  className={field}
                  style={fieldStyle}
                  placeholder={ph}
                />
                {errors[key] && (
                  <p className="text-xs text-red-500">{errors[key]?.message}</p>
                )}
              </div>
            ))}
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label
                className="text-xs"
                style={{ color: "var(--color-muted-stone)" }}
              >
                Check-in Time
              </label>
              <input
                {...register("checkInTime")}
                type="time"
                className={field}
                style={fieldStyle}
                defaultValue="14:00"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                className="text-xs"
                style={{ color: "var(--color-muted-stone)" }}
              >
                Check-out Time
              </label>
              <input
                {...register("checkOutTime")}
                type="time"
                className={field}
                style={fieldStyle}
                defaultValue="11:00"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-full border text-sm transition-opacity hover:opacity-70"
              style={{
                borderColor: "var(--color-fog)",
                color: "var(--color-muted-stone)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 h-10 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-ink)",
                color: "var(--color-canvas)",
              }}
            >
              {isSaving ? "Saving..." : "Create Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
