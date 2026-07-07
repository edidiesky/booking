import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Trash2, ImagePlus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/common/Toast";
import { useCreateRoomTypeMutation } from "@/redux/services/propertyApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  uploadImageToCloudinary,
  type UploadProgress,
} from "@/redux/services/cloudinaryAPI";

//  types
interface FormState {
  name: string;
  description: string;
  maxOccupancy: number;
  basePriceNgn: number;
  quantity: number;
  amenities: string[];
  status: "active" | "inactive";
}

const EMPTY: FormState = {
  name: "",
  description: "",
  maxOccupancy: 2,
  basePriceNgn: 0,
  quantity: 1,
  amenities: [],
  status: "active",
};

interface PendingFile {
  preview: string;
  progress: number;
  error: string | null;
}

interface ImageSectionProps {
  images: string[];
  onChange: (updater: string[] | ((prev: string[]) => string[])) => void;
}

function ImageSection({ images, onChange }: ImageSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFile[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const preview = URL.createObjectURL(file);
      setPending((prev) => [...prev, { preview, progress: 0, error: null }]);

      uploadImageToCloudinary(file, (p: UploadProgress) => {
        setPending((prev) =>
          prev.map((e) =>
            e.preview === preview ? { ...e, progress: p.percent } : e,
          ),
        );
      })
        .then((res) => {
          onChange((prev) => [...prev, res.secure_url]);
          setPending((prev) => prev.filter((e) => e.preview !== preview));
          URL.revokeObjectURL(preview);
        })
        .catch((err: Error) => {
          setPending((prev) =>
            prev.map((e) =>
              e.preview === preview ? { ...e, error: err.message } : e,
            ),
          );
        });
    });
  };

  const removeUploaded = (i: number) =>
    onChange(images.filter((_, idx) => idx !== i));

  const removePending = (preview: string) => {
    URL.revokeObjectURL(preview);
    setPending((prev) => prev.filter((e) => e.preview !== preview));
  };

  const hasAny = images.length > 0 || pending.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm bold text-[#17191c]">Room Photos</span>

      {hasAny ? (
        <div className="grid grid-cols-4 gap-3">
          {images.map((src, i) => (
            <div
              key={src}
              className="relative group aspect-square border rounded-2xl border-[#e8e6e3] overflow-hidden"
            >
              <img
                src={src}
                alt={`room-${i}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeUploaded(i)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                aria-label="Remove image"
              >
                <Trash2 size={16} className="text-white" />
              </button>
            </div>
          ))}

          {pending.map((p) => (
            <div
              key={p.preview}
              className="relative aspect-square border rounded-2xl border-[#e8e6e3] overflow-hidden"
            >
              <img
                src={p.preview}
                alt="uploading"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/60">
                {p.error ? (
                  <>
                    <span className="text-[10px] text-red-600 text-center px-1">
                      {p.error}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePending(p.preview)}
                      className="text-[10px] underline text-[#4c4c4c]"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin text-[#17191c]"
                    />
                    <span className="text-[10px] text-[#4c4c4c]">
                      {p.progress}%
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-[#e8e6e3] flex flex-col items-center justify-center gap-1 hover:border-[#17191c] hover:bg-[#fafaf9] transition-colors"
          >
            <ImagePlus size={18} className="text-[#a3a6af]" />
            <span className="text-xs text-[#a3a6af]">Add</span>
          </button>
        </div>
      ) : (
        <div
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-[#e8e6e3] h-[130px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#17191c] hover:bg-[#fafaf9] transition-colors"
        >
          <Upload size={20} className="text-[#a3a6af]" />
          <p className="text-sm text-[#777b86]">
            Drag & drop or <span className="text-[#17191c]">browse</span>
          </p>
          <p className="text-xs text-[#a3a6af]">PNG, JPG, WebP</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

//  tag input

interface TagInputProps {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}

function TagInput({ label, placeholder, tags, onChange }: TagInputProps) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setDraft("");
  };

  const remove = (i: number) => onChange(tags.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-[#17191c]">{label}</span>
      <div className=" py-2 px-2 flex flex-wrap gap-2 min-h-[45px] focus-within:border-[#17191c] transition-colors">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-4 rounded-full bold py-1 bg-[#f2f0ed] text-sm text-[#17191c]"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <Input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
            if (e.key === "Backspace" && !draft && tags.length > 0)
              remove(tags.length - 1);
          }}
          placeholder={tags.length === 0 ? placeholder : ""}
        />
      </div>
      <p className="text-xs text-[#a3a6af]">Press Enter or comma to add</p>
    </div>
  );
}

//  modal

interface Props {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateRoomTypeModal({
  propertyId,
  isOpen,
  onClose,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [images, setImages] = useState<string[]>([]);

  const [createRoomType, { isLoading }] = useCreateRoomTypeMutation();

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY);
      setImages([]);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!form.name || form.name.length < 2) {
      showToast("Room name must be at least 2 characters.", "error");
      return;
    }
    if (form.maxOccupancy < 1) {
      showToast("Max guests must be at least 1.", "error");
      return;
    }
    if (form.quantity < 1) {
      showToast("Quantity must be at least 1.", "error");
      return;
    }
    if (form.basePriceNgn < 0) {
      showToast("Price cannot be negative.", "error");
      return;
    }

    try {
      await createRoomType({
        propertyId,
        body: {
          name: form.name,
          description: form.description || undefined,
          maxOccupancy: form.maxOccupancy,
          basePriceNgn: form.basePriceNgn,
          quantity: form.quantity,
          amenities: form.amenities,
          images,
          status: form.status,
        },
      }).unwrap();
      showToast("Room type added.", "success");
      onClose();
    } catch {
      /* errorMiddleware */
    }
  };

  const isBusy = isLoading;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm p-4 flex items-center justify-end z-50">
      <motion.div
        initial={{ x: 600 }}
        animate={isOpen ? { x: 0 } : { x: 600 }}
        exit={{ x: 600 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white w-full rounded-2xl overflow-hidden relative flex flex-col lg:w-[560px] h-full"
      >
        {/* header */}
        <div className="border-b border-[#e8e6e3] flex items-center justify-between px-8 h-[72px] shrink-0">
          <div>
            <h4 className="text-lg bold text-[#17191c]">Add Room Type</h4>
            <p className="text-sm text-[#777b86] mt-0.5">
              Define a room category, pricing, and availability for this
              property.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center hover:bg-[#f2f0ed] transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Room Name"
                  placeholder="e.g. Deluxe Studio"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
                <Input
                  label="Price / Night (₦)"
                  type="number"
                  placeholder="50000"
                  value={form.basePriceNgn}
                  onChange={(e) =>
                    setField("basePriceNgn", Number(e.target.value))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Max Guests"
                  type="number"
                  value={form.maxOccupancy}
                  onChange={(e) =>
                    setField("maxOccupancy", Number(e.target.value))
                  }
                />
                <Input
                  label="Quantity"
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setField("quantity", Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm bold text-[#17191c]">Status</label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setField("status", v as "active" | "inactive")
                  }
                >
                  <SelectTrigger className="h-[42px] border border-[#e8e6e3] px-3 text-sm outline-none focus:border-[#17191c] transition-colors bg-white text-[#17191c] w-full rounded-none shadow-none focus:ring-0">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#e8e6e3] shadow-sm rounded-xl">
                    {[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Inactive" },
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
                </Select>
              </div>

              <ImageSection
                images={images}
                onChange={(updater) =>
                  setImages((prev) =>
                    typeof updater === "function" ? updater(prev) : updater,
                  )
                }
              />

              <TagInput
                label="Amenities"
                placeholder="e.g. WiFi, AC, Hot water"
                tags={form.amenities}
                onChange={(tags) => setField("amenities", tags)}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-[#17191c]">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  rows={4}
                  className="border border-[#e8e6e3] px-3 py-2.5 text-sm outline-none resize-none focus:border-[#17191c] transition-colors"
                  placeholder="Describe this room type, inclusions, and guest experience..."
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* footer */}
        <div className="border-t border-[#e8e6e3] h-[68px] flex items-center justify-between px-8 shrink-0">
          <button
            onClick={onClose}
            className="text-sm text-[#4c4c4c] hover:text-[#17191c] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isBusy}
            className="bg-[#17191c] text-white text-sm rounded-full px-6 h-9 flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isBusy ? "Saving..." : "Save room type"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
