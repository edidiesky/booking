import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/common/Toast";
import {
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useGetPropertyByIdQuery,
} from "@/redux/services/propertyApi";
import { ChartSelect } from "@/components/common/charts/Chartselect";
import LocationPicker from "@/components/common/LocationPicker";
import { geocodeAddress } from "@/hooks/useGeocodeAddress";
import RichTextEditor from "@/components/common/RichTextEditor";
import { AMENITY_GROUPS, AMENITY_OPTIONS } from "@/constants/amenities";
import { CreatePropertyPayload } from "@/types/api";

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
  status: z.enum(["draft", "active", "paused"]),
});

const PROPERTY_TYPE_OPTIONS = [
  { label: "Shortlet", value: "shortlet" },
  { label: "Hotel", value: "hotel" },
  { label: "Guesthouse", value: "guesthouse" },
];

const STATUS_LABELS: Record<"draft" | "active" | "paused", string> = {
  draft: "Draft, hidden from guests",
  active: "Active, visible to guests",
  paused: "Paused, hidden from guests",
};

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
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyModal({ propertyId, isOpen, onClose }: Props) {
  const isEdit = Boolean(propertyId);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const { data: propertyData, isLoading: loadingProperty } =
    useGetPropertyByIdQuery(propertyId ?? "", { skip: !propertyId });

  const [createProperty, { isLoading: creating }] = useCreatePropertyMutation();
  const [updateProperty, { isLoading: updating }] = useUpdatePropertyMutation();
  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyType: "shortlet",
      country: "Nigeria",
      checkInTime: "14:00",
      checkOutTime: "11:00",
      status: "draft",
    },
  });

  const existing = propertyData?.data;
  // The public detail endpoint returns active room types only.
  const hasActiveRoom = (existing?.roomTypes?.length ?? 0) > 0;
  const statusOptions = (
    hasActiveRoom
      ? (["draft", "active", "paused"] as const)
      : (["draft", "paused"] as const)
  ).map((value) => ({ value, label: STATUS_LABELS[value] }));

  useEffect(() => {
    const p = propertyData?.data;
    if (p) {
      setAmenities(p.amenities ?? []);
      setLatitude(p.latitude ?? null);
      setLongitude(p.longitude ?? null);
      reset({
        name: p.name,
        description: p.description,
        propertyType: p.propertyType,
        street: p.address.street,
        city: p.address.city,
        state: p.address.state,
        country: p.address.country,
        checkInTime: p.checkInTime,
        checkOutTime: p.checkOutTime,
        status: p.status === "archived" ? "draft" : p.status,
      });
    } else if (!propertyId) {
      setAmenities([]);
      setLatitude(null);
      setLongitude(null);
      reset({
        propertyType: "shortlet",
        country: "Nigeria",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        status: "draft",
      });
    }
  }, [propertyData, propertyId, reset]);

  const handleSave = async (data: FormData) => {
    try {
      const coords = await resolveCoords(data);
      if (!coords) {
        showToast(
          "Set the property location on the map (or complete the address and click Locate).",
          "error",
        );
        return;
      }

      if (isEdit && propertyId) {
        await updateProperty({
          id: propertyId,
          body: {
            name: data.name,
            description: data.description,
            amenities,
            checkInTime: data.checkInTime,
            checkOutTime: data.checkOutTime,
            address: {
              street: data.street,
              city: data.city,
              state: data.state,
              country: data.country,
            },
            latitude: coords.lat,
            longitude: coords.lng,
            ...(data.status !== existing?.status
              ? { status: data.status }
              : {}),
          },
        }).unwrap();
        showToast("Property updated.", "success");
      } else {
        const prop: CreatePropertyPayload = {
          name: data.name,
          description: data.description ?? "",
          propertyType: data.propertyType,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            country: data.country,
          },
          amenities,
          checkInTime: data.checkInTime,
          checkOutTime: data.checkOutTime,
          latitude: coords.lat,
          longitude: coords.lng,
          status: data.status === "paused" ? "paused" : "draft",
        };
        // console.log("prop:", prop)
        await createProperty(prop).unwrap();
        showToast("Property created.", "success");
      }
      onClose();
    } catch {
      /* errorMiddleware */
    }
  };

  const handleAddressBlur = async () => {
    const { street, city, state, country } = getValues();
    if (!city?.trim() || !country?.trim()) return;
    setGeocoding(true);
    try {
      const result = await geocodeAddress({
        street: street ?? "",
        city,
        state: state ?? "",
        country,
      });
      if (result) {
        setLatitude(result.latitude);
        setLongitude(result.longitude);
      }
    } catch {
      // non-fatal
    } finally {
      setGeocoding(false);
    }
  };

  const handleLocateClick = async () => {
    const { street, city, state, country } = getValues();
    if (!city?.trim() || !country?.trim()) {
      showToast("Enter at least city and country first.", "error");
      return;
    }
    setGeocoding(true);
    try {
      const result = await geocodeAddress({
        street: street ?? "",
        city,
        state: state ?? "",
        country,
      });
      if (result) {
        setLatitude(result.latitude);
        setLongitude(result.longitude);
        showToast("Location found — adjust the pin if needed.", "success");
      } else {
        showToast(
          "Could not find that address. Click the map to place the pin.",
          "error",
        );
      }
    } catch {
      showToast(
        "Location lookup failed. Click the map to place the pin.",
        "error",
      );
    } finally {
      setGeocoding(false);
    }
  };

  const isBusy = creating || updating;

  const resolveCoords = async (
    data: FormData,
  ): Promise<{ lat: number; lng: number } | null> => {
    if (
      latitude != null &&
      longitude != null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      return { lat: latitude, lng: longitude };
    }
    setGeocoding(true);
    try {
      const result = await geocodeAddress({
        street: data.street,
        city: data.city,
        state: data.state,
        country: data.country,
      });
      if (result) {
        setLatitude(result.latitude);
        setLongitude(result.longitude);
        return { lat: result.latitude, lng: result.longitude };
      }
    } finally {
      setGeocoding(false);
    }
    return null;
  };

  const inputClass =
    "h-[42px] border border-[#e8e6e3] px-3 text-xs lg:text-[13px]   outline-none focus:border-[#17191c] transition-colors w-full";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-end p-4 z-50">
      <motion.div
        initial={{ x: 800 }}
        animate={isOpen ? { x: 0 } : { x: 800 }}
        exit={{ x: 800 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white w-full rounded-2xl overflow-hidden relative flex flex-col lg:w-[750px] h-full"
      >
        {/* header */}
        <div className="border-b flex items-center justify-between px-8 h-[72px] shrink-0">
          <div>
            <h4 className="text-base     text-[#17191c]">
              {isEdit ? "Edit Property" : "Create Property"}
            </h4>
            <p className="text-xs lg:text-[13px]     text-[#777b86] mt-0.5">
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
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <FieldSkeleton key={i} />
                  ))}
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs lg:text-[13px]     text-[#17191c]">
                      Property Name
                    </label>
                    <Input
                      {...register("name")}
                      className={inputClass}
                      placeholder="e.g. Lekki Heights Shortlet"
                    />
                    {errors.name && (
                      <p className="text-xs lg:text-[13px]   text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs lg:text-[13px]     text-[#17191c]">
                      Property Type
                    </label>
                    <Controller
                      name="propertyType"
                      control={control}
                      render={({ field }) => (
                        <ChartSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          options={PROPERTY_TYPE_OPTIONS}
                          placeholder="Select type"
                        />
                      )}
                    />
                    {errors.propertyType && (
                      <p className="text-xs lg:text-[13px]   text-red-500">
                        {errors.propertyType.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs lg:text-[13px] text-[#17191c]">
                      Status
                    </label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <ChartSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          options={statusOptions}
                          placeholder="Select status"
                        />
                      )}
                    />
                    {/* <p className="text-xs text-[#a3a6af]">
                        {hasActiveRoom
                          ? "Active properties appear on your storefront and the main website."
                          : "Add at least one active room type to publish this property. Until then it stays hidden from guests."}
                      </p> */}
                  </div>
                </div>
                {/* description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs lg:text-[13px] text-[#17191c]">
                    Description
                  </label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>

                {/* address */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs lg:text-[13px]     text-[#a3a6af] uppercase tracking-widest ">
                    Address
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ["street", "Street", "5 Admiralty Way"],
                        ["city", "City", "Lagos"],
                        ["state", "State", "Lagos"],
                        ["country", "Country", "Nigeria"],
                      ] as const
                    ).map(([key, label, ph]) => {
                      const fieldProps = register(key);
                      return (
                        <div key={key} className="flex flex-col gap-1.5">
                          <label className="text-xs lg:text-[13px]     text-[#17191c]">
                            {label}
                          </label>
                          <Input
                            {...fieldProps}
                            onBlur={(e) => {
                              fieldProps.onBlur(e);
                              void handleAddressBlur();
                            }}
                            className={inputClass}
                            placeholder={ph}
                          />
                          {errors[key] && (
                            <p className="text-xs lg:text-[13px]   text-red-500">
                              {errors[key]?.message}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-xs lg:text-[13px] text-[#a3a6af]">
                        {geocoding
                          ? "Locating…"
                          : latitude != null && longitude != null
                            ? `Pin set (${latitude.toFixed(5)}, ${longitude.toFixed(5)}) — click map to adjust.`
                            : "Fill the address, then Locate — or click the map to place the pin."}
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleLocateClick()}
                        disabled={geocoding}
                        className="shrink-0 h-8 rounded-full border border-[#e8e6e3] px-3 text-[12px] font-medium text-[#17191c] hover:bg-[#f7f7f5] disabled:opacity-50"
                      >
                        {geocoding ? "Locating…" : "Locate"}
                      </button>
                    </div>
                    <LocationPicker
                      latitude={latitude}
                      longitude={longitude}
                      onChange={(lat, lng) => {
                        setLatitude(lat);
                        setLongitude(lng);
                      }}
                    />
                  </div>
                </div>

                {/* times */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs lg:text-[13px]     text-[#17191c]">
                      Check-in Time
                    </label>
                    <Input
                      {...register("checkInTime")}
                      type="time"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs lg:text-[13px]     text-[#17191c]">
                      Check-out Time
                    </label>
                    <Input
                      {...register("checkOutTime")}
                      type="time"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <span className="text-xs lg:text-[13px] text-[#17191c]">
                    Amenities
                  </span>
                  <p className="text-[12px] text-[#777b86] -mt-2">
                    Select all that apply. Guests will filter by these.
                  </p>
                  {AMENITY_GROUPS.map((g) => (
                    <div key={g.key} className="flex flex-col gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#a3a6af]">
                        {g.title}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {AMENITY_OPTIONS.filter((a) => a.group === g.key).map(
                          (a) => {
                            const on =
                              amenities.includes(a.id) ||
                              amenities.includes(a.label);
                            return (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => {
                                  setAmenities((prev) =>
                                    on
                                      ? prev.filter(
                                          (x) => x !== a.id && x !== a.label,
                                        )
                                      : [...prev, a.id],
                                  );
                                }}
                                className={`h-9 rounded-full border px-3.5 text-[12px] transition-colors ${
                                  on
                                    ? "border-[#17191c] bg-[#f7f7f5] font-medium text-[#17191c]"
                                    : "border-[#e8e6e3] text-[#444] hover:border-[#c4c6ce]"
                                }`}
                              >
                                {a.label}
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* footer */}
        <div className="border-t h-[68px] flex items-center justify-between px-8 shrink-0">
          <button
            onClick={onClose}
            className="text-xs lg:text-[13px]     text-[#4c4c4c] hover:text-[#17191c] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="property-form"
            disabled={isBusy}
            className="bg-[#17191c] text-white text-xs lg:text-[13px]     px-6 rounded-full h-9 flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isBusy
              ? isEdit
                ? "Updating..."
                : "Saving..."
              : isEdit
                ? "Update property"
                : "Save property"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
