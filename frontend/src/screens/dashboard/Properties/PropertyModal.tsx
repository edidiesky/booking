import { useEffect }     from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X }                       from "lucide-react";
import { useForm }                 from "react-hook-form";
import { zodResolver }             from "@hookform/resolvers/zod";
import { z }                       from "zod";
import { Input }                   from "@/components/ui/input";
import { showToast }               from "@/components/common/Toast";
import { useCreatePropertyMutation, useUpdatePropertyMutation, useGetPropertyByIdQuery } from "@/redux/services/propertyApi";

const schema = z.object({
  name:         z.string().min(3, "Min 3 characters"),
  description:  z.string().optional(),
  propertyType: z.enum(["shortlet", "hotel", "guesthouse"]),
  street:       z.string().min(1, "Required"),
  city:         z.string().min(1, "Required"),
  state:        z.string().min(1, "Required"),
  country:      z.string().min(1, "Required"),
  checkInTime:  z.string().optional(),
  checkOutTime: z.string().optional(),
  amenities:    z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-4 w-24 bg-[#f2f0ed] rounded animate-pulse" />
      <div className="h-[42px] w-full bg-[#f2f0ed] rounded animate-pulse" />
    </div>
  );
}

interface Props {
  propertyId?: string | null;
  isOpen:      boolean;
  onClose:     () => void;
}

export default function PropertyModal({ propertyId, isOpen, onClose }: Props) {
  const isEdit = Boolean(propertyId);

  const { data: propertyData, isLoading: loadingProperty } = useGetPropertyByIdQuery(
    propertyId ?? "", { skip: !propertyId }
  );

  const [createProperty, { isLoading: creating }] = useCreatePropertyMutation();
  const [updateProperty, { isLoading: updating }] = useUpdatePropertyMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver:      zodResolver(schema),
    defaultValues: { propertyType: "shortlet", country: "Nigeria", checkInTime: "14:00", checkOutTime: "11:00" },
  });

  useEffect(() => {
    const p = propertyData?.data;
    if (p) {
      reset({
        name:         p.name,
        description:  p.description,
        propertyType: p.propertyType,
        street:       p.address.street,
        city:         p.address.city,
        state:        p.address.state,
        country:      p.address.country,
        checkInTime:  p.checkInTime,
        checkOutTime: p.checkOutTime,
        amenities:    p.amenities.join(", "),
      });
    } else if (!propertyId) {
      reset({ propertyType: "shortlet", country: "Nigeria", checkInTime: "14:00", checkOutTime: "11:00" });
    }
  }, [propertyData, propertyId, reset]);

  const handleSave = async (data: FormData) => {
    const amenities = data.amenities
      ? data.amenities.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    try {
      if (isEdit && propertyId) {
        await updateProperty({
          id:   propertyId,
          body: {
            name:         data.name,
            description:  data.description,
            amenities,
            checkInTime:  data.checkInTime,
            checkOutTime: data.checkOutTime,
          },
        }).unwrap();
        showToast("Property updated.", "success");
      } else {
        await createProperty({
          name:         data.name,
          description:  data.description ?? "",
          propertyType: data.propertyType,
          address:      { street: data.street, city: data.city, state: data.state, country: data.country },
          amenities,
          checkInTime:  data.checkInTime,
          checkOutTime: data.checkOutTime,
        }).unwrap();
        showToast("Property created.", "success");
      }
      onClose();
    } catch { /* errorMiddleware */ }
  };

  const isBusy = creating || updating;

  const inputClass = "h-[42px] border border-[#e8e6e3] px-3 text-sm outline-none focus:border-[#17191c] transition-colors w-full";

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-end z-50">
      <motion.div
        initial={{ x: 800 }}
        animate={isOpen ? { x: 0 } : { x: 800 }}
        exit={{ x: 800 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white w-full rounded-l-2xl overflow-hidden relative flex flex-col lg:w-[750px] h-full"
      >
        {/* header */}
        <div className="border-b flex items-center justify-between px-8 h-[72px] shrink-0">
          <div>
            <h4 className="text-lg font-semibold text-[#17191c]">
              {isEdit ? "Edit Property" : "Create Property"}
            </h4>
            <p className="text-sm text-[#777b86] mt-0.5">
              {isEdit
                ? "Update your property details and availability settings."
                : "Fill in the details below to add a new property listing."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center hover:bg-[#f2f0ed] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <AnimatePresence mode="wait">
            {loadingProperty && isEdit ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <FieldSkeleton key={i} />)}
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit(handleSave)}
                className="flex flex-col gap-6"
                id="property-form"
              >
                {/* name + type */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#17191c]">Property Name</label>
                    <Input {...register("name")} className={inputClass} placeholder="e.g. Lekki Heights Shortlet" />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#17191c]">Property Type</label>
                    <select {...register("propertyType")} className={inputClass}>
                      <option value="shortlet">Shortlet</option>
                      <option value="hotel">Hotel</option>
                      <option value="guesthouse">Guesthouse</option>
                    </select>
                  </div>
                </div>

                {/* description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#17191c]">Description</label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    className="border border-[#e8e6e3] px-3 py-2.5 text-sm outline-none resize-none focus:border-[#17191c] transition-colors"
                    placeholder="Describe your property, nearby landmarks, access instructions..."
                  />
                </div>

                {/* address */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-[#a3a6af] uppercase tracking-widest font-semibold">Address</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ["street",  "Street",  "5 Admiralty Way"],
                      ["city",    "City",    "Lagos"],
                      ["state",   "State",   "Lagos"],
                      ["country", "Country", "Nigeria"],
                    ] as const).map(([key, label, ph]) => (
                      <div key={key} className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-[#17191c]">{label}</label>
                        <Input {...register(key)} className={inputClass} placeholder={ph} />
                        {errors[key] && <p className="text-xs text-red-500">{errors[key]?.message}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* times */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#17191c]">Check-in Time</label>
                    <Input {...register("checkInTime")} type="time" className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#17191c]">Check-out Time</label>
                    <Input {...register("checkOutTime")} type="time" className={inputClass} />
                  </div>
                </div>

                {/* amenities */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#17191c]">Amenities</label>
                  <Input
                    {...register("amenities")}
                    className={inputClass}
                    placeholder="WiFi, Pool, Generator, Parking (comma separated)"
                  />
                  <p className="text-xs text-[#a3a6af]">Separate each amenity with a comma</p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* footer */}
        <div className="border-t h-[68px] flex items-center justify-between px-8 shrink-0">
          <button
            onClick={onClose}
            className="text-sm text-[#4c4c4c] hover:text-[#17191c] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="property-form"
            disabled={isBusy}
            className="bg-[#17191c] text-white text-sm px-6 h-9 flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isBusy
              ? isEdit ? "Updating..." : "Saving..."
              : isEdit ? "Update property" : "Save property"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}