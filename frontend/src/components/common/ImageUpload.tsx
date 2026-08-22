import { useRef, useState }          from "react";
import { Upload, Trash2, ImagePlus, Loader2 } from "lucide-react";
import {
  uploadImageToCloudinary,
  type UploadProgress,
} from "@/redux/services/cloudinaryAPI";

interface PendingFile {
  preview:  string;
  progress: number;
  error:    string | null;
}

interface Props {
  images:   string[];
  onChange: (updater: string[] | ((prev: string[]) => string[])) => void;
  label?:   string;
  max?:     number;
}

export default function ImageUpload({ images, onChange, label = "Images", max = 8 }: Props) {
  const inputRef              = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFile[]>([]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = max - images.length - pending.filter((p) => !p.error).length;
    Array.from(files).slice(0, remaining).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const preview = URL.createObjectURL(file);
      setPending((prev) => [...prev, { preview, progress: 0, error: null }]);

      uploadImageToCloudinary(file, (p: UploadProgress) => {
        setPending((prev) =>
          prev.map((e) => e.preview === preview ? { ...e, progress: p.percent } : e)
        );
      })
        .then((res) => {
          onChange((prev) => [...prev, res.secure_url]);
          setPending((prev) => prev.filter((e) => e.preview !== preview));
          URL.revokeObjectURL(preview);
        })
        .catch((err: Error) => {
          setPending((prev) =>
            prev.map((e) => e.preview === preview ? { ...e, error: err.message } : e)
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

  const hasAny  = images.length > 0 || pending.length > 0;
  const canMore = images.length + pending.filter((p) => !p.error).length < max;

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs lg:text-[13px]     text-[#17191c]">{label}</span>

      {hasAny ? (
        <div className="grid grid-cols-4 gap-3">
          {images.map((src, i) => (
            <div key={src} className="relative group aspect-square border border-[#e8e6e3] overflow-hidden">
              <img src={src} alt={`upload-${i}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeUploaded(i)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Trash2 size={16} className="text-white" />
              </button>
            </div>
          ))}

          {pending.map((p) => (
            <div key={p.preview} className="relative aspect-square border border-[#e8e6e3] overflow-hidden">
              <img src={p.preview} alt="uploading" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/60">
                {p.error ? (
                  <>
                    <span className="text-[10px] text-red-600 text-center px-1">{p.error}</span>
                    <button type="button" onClick={() => removePending(p.preview)}
                      className="text-[10px] underline text-[#4c4c4c]">
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#17191c]" />
                    <span className="text-[10px] text-[#4c4c4c]">{p.progress}%</span>
                  </>
                )}
              </div>
            </div>
          ))}

          {canMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-[#e8e6e3] flex flex-col items-center justify-center gap-1 hover:border-[#17191c] hover:bg-[#fafaf9] transition-colors"
            >
              <ImagePlus size={18} className="text-[#a3a6af]" />
              <span className="text-xs lg:text-[13px]     text-[#a3a6af]">Add</span>
            </button>
          )}
        </div>
      ) : (
        <div
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-[#e8e6e3] h-[130px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#17191c] hover:bg-[#fafaf9] transition-colors"
        >
          <Upload size={20} className="text-[#a3a6af]" />
          <p className="text-xs lg:text-[13px]     text-[#777b86]">
            Drag & drop or <span className="text-[#17191c]">browse</span>
          </p>
          <p className="text-xs lg:text-[13px]     text-[#a3a6af]">PNG, JPG, WebP — max {max} images</p>
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