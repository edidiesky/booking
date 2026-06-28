import { useForm }     from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z }           from "zod";
import type { CreateRoomTypePayload } from "@/types/api";

const schema = z.object({
  name:         z.string().min(2, "Min 2 characters"),
  description:  z.string().optional(),
  maxOccupancy: z.coerce.number().int().min(1, "At least 1"),
  basePriceNgn: z.coerce.number().min(0, "Must be positive"),
  quantity:     z.coerce.number().int().min(1, "At least 1"),
  amenities:    z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  propertyId: string;
  onClose:    () => void;
  onSubmit:   (propertyId: string, payload: CreateRoomTypePayload) => Promise<boolean>;
  isSaving:   boolean;
}

const field      = "w-full h-10 px-3 text-sm border rounded-lg outline-none";
const fieldStyle = { borderColor: "var(--color-fog)", color: "var(--color-ink)" };

export default function CreateRoomTypeModal({ propertyId, onClose, onSubmit, isSaving }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { maxOccupancy: 2, quantity: 1 },
  });

  const submit = async (data: FormData) => {
    const amenities = data.amenities
      ? data.amenities.split(",").map((a) => a.trim()).filter(Boolean)
      : [];

    const ok = await onSubmit(propertyId, {
      name:         data.name,
      description:  data.description,
      maxOccupancy: data.maxOccupancy,
      basePriceNgn: data.basePriceNgn,
      quantity:     data.quantity,
      amenities,
    });
    if (ok) { reset(); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="w-full max-w-md rounded-2xl p-8 flex flex-col gap-6 overflow-y-auto max-h-[90vh]"
           style={{ backgroundColor: "var(--color-canvas)" }}>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-ink)" }}>Add Room Type</h2>
          <button onClick={onClose} className="text-2xl leading-none opacity-40 hover:opacity-100">×</button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "var(--color-muted-stone)" }}>Room Name</label>
            <input {...register("name")} className={field} style={fieldStyle} placeholder="e.g. Deluxe Studio" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "var(--color-muted-stone)" }}>Description</label>
            <textarea {...register("description")} rows={2}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none resize-none"
              style={fieldStyle} placeholder="Optional room description" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: "var(--color-muted-stone)" }}>Max Occupancy</label>
              <input {...register("maxOccupancy")} type="number" min={1} className={field} style={fieldStyle} />
              {errors.maxOccupancy && <p className="text-xs text-red-500">{errors.maxOccupancy.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: "var(--color-muted-stone)" }}>Quantity</label>
              <input {...register("quantity")} type="number" min={1} className={field} style={fieldStyle} />
              {errors.quantity && <p className="text-xs text-red-500">{errors.quantity.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: "var(--color-muted-stone)" }}>Price / Night (₦)</label>
              <input {...register("basePriceNgn")} type="number" min={0} className={field} style={fieldStyle} placeholder="50000" />
              {errors.basePriceNgn && <p className="text-xs text-red-500">{errors.basePriceNgn.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "var(--color-muted-stone)" }}>
              Amenities <span className="opacity-50">(comma-separated)</span>
            </label>
            <input {...register("amenities")} className={field} style={fieldStyle}
              placeholder="WiFi, AC, Hot water, Smart TV" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-10 rounded-full border text-sm transition-opacity hover:opacity-70"
              style={{ borderColor: "var(--color-fog)", color: "var(--color-muted-stone)" }}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="flex-1 h-10 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}>
              {isSaving ? "Saving..." : "Add Room Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}