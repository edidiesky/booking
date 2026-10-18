
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { showToast } from "@/components/common/Toast";
import { uploadImageToCloudinary } from "@/redux/services/cloudinaryAPI";
import {
  useAttachPropertyImagesMutation,
  type AttachImageResultItem,
} from "@/redux/services/propertyImportApi";

const MAX_FILES = 100;
const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

type Phase =
  | { kind: "choose" }
  | { kind: "uploading"; done: number; total: number }
  | { kind: "linking" }
  | {
      kind: "done";
      linked: number;
      unmatched: number;
      results: AttachImageResultItem[];
      example: string;
    };

interface PendingFile {
  file: File;
  preview: string;
}

interface Props {
  onClose: () => void;
  batchId?: string;
}

export default function BulkPropertyImagesModal({ onClose, batchId }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: "choose" });
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [attachPropertyImages] = useAttachPropertyImagesMutation();

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFileError(null);
    const next: PendingFile[] = [];
    for (const file of Array.from(list)) {
      if (!file.type.startsWith("image/")) continue;
      next.push({ file, preview: URL.createObjectURL(file) });
    }
    setPending((prev) => {
      const combined = [...prev, ...next];
      if (combined.length > MAX_FILES) {
        setFileError(`You can upload at most ${MAX_FILES} images at once.`);
        next.forEach((p) => URL.revokeObjectURL(p.preview));
        return prev;
      }
      return combined;
    });
  };

  const removeFile = (preview: string) => {
    setPending((prev) => {
      const target = prev.find((p) => p.preview === preview);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.preview !== preview);
    });
  };

  const handleClose = () => {
    pending.forEach((p) => URL.revokeObjectURL(p.preview));
    onClose();
  };

  const handleUpload = async () => {
    if (!pending.length) return;
    setFileError(null);

    const attachments: { fileName: string; url: string }[] = [];
    setPhase({ kind: "uploading", done: 0, total: pending.length });

    try {
      for (let i = 0; i < pending.length; i++) {
        const { file } = pending[i];
        const res = await uploadImageToCloudinary(file);
        attachments.push({ fileName: file.name, url: res.secure_url });
        setPhase({ kind: "uploading", done: i + 1, total: pending.length });
      }

      setPhase({ kind: "linking" });
      const result = await attachPropertyImages({
        attachments,
        batchId,
      }).unwrap();

      pending.forEach((p) => URL.revokeObjectURL(p.preview));
      setPending([]);
      setPhase({
        kind: "done",
        linked: result.linked,
        unmatched: result.unmatched,
        results: result.results,
        example: result.example,
      });
    } catch (err) {
      setFileError((err as Error).message || "Upload failed. Try again.");
      setPhase({ kind: "choose" });
      showToast("Couldn't link property photos. Try again.", "error");
    }
  };

  const isBusy = phase.kind === "uploading" || phase.kind === "linking";
  const unmatchedResults =
    phase.kind === "done"
      ? phase.results.filter((r) => r.status !== "linked")
      : [];

  return (
    <div
      className="h-[100vh] bg-[#16161639] inset-0 backdrop-blur-sm w-full fixed top-0 left-0 z-[5000] flex items-end md:items-center justify-center px-4"
      onClick={isBusy ? undefined : handleClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-property-images-title"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full md:w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 flex flex-col gap-5 lg:gap-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h3
              id="bulk-property-images-title"
              className="text-lg lg:text-xl font-medium text-[#17191c]"
            >
              Bulk upload <br /> property photos
            </h3>
            <p className="text-xs lg:text-sm text-[#777b86] mt-1">
              Name files as{" "}
              <span className="font-medium text-[#17191c]">
                property_ref__position.jpg
              </span>{" "} <br />
              (e.g.{" "}
              <span className="text-sm text-[#17191c]">
                LKI-001__1.jpg
              </span>
              ). Photos are matched to properties by{" "}
              <span className="font-medium text-[#17191c]">property_ref</span>{" "}
              and slotted by position.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            aria-label="Close"
            className="p-1 rounded-lg hover:bg-[#f2f0ed] disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {phase.kind === "choose" && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                if (inputRef.current) inputRef.current.value = "";
              }}
            />

            {pending.length === 0 ? (
              <div
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-[#e8e6e3] rounded-xl h-36 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#17191c] hover:bg-[#fafaf9] transition-colors"
              >
                <Upload size={20} className="text-[#a3a6af]" />
                <span className="text-xs lg:text-[13px] text-[#777b86]">
                  Drop images here or click to choose
                </span>
                <span className="text-[11px] text-[#a3a6af]">
                  JPG, PNG, WebP, GIF · up to {MAX_FILES} files
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-4 gap-2">
                  {pending.map((p) => (
                    <div
                      key={p.preview}
                      className="relative group aspect-square border border-[#e8e6e3] overflow-hidden rounded-lg"
                    >
                      <img
                        src={p.preview}
                        alt={p.file.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(p.preview)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Trash2 size={14} className="text-white" />
                      </button>
                      <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] px-1 py-0.5 truncate">
                        {p.file.name}
                      </span>
                    </div>
                  ))}
                  {pending.length < MAX_FILES && (
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-[#e8e6e3] rounded-lg flex flex-col items-center justify-center gap-1 hover:border-[#17191c] hover:bg-[#fafaf9] transition-colors"
                    >
                      <ImagePlus size={16} className="text-[#a3a6af]" />
                      <span className="text-[11px] text-[#a3a6af]">Add</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[#a3a6af]">
                  {pending.length} image{pending.length === 1 ? "" : "s"} selected
                </p>
              </div>
            )}

            {fileError && (
              <p className="text-xs text-red-600 flex items-start gap-1.5">
                <XCircle size={14} className="shrink-0 mt-0.5" />
                {fileError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="h-9 px-4 rounded-lg border border-[#e8e6e3] text-xs lg:text-[13px] hover:bg-[#f2f0ed]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!pending.length}
                onClick={() => void handleUpload()}
                className="h-9 px-5 rounded-lg bg-[#17191c] text-white text-xs lg:text-[13px] hover:opacity-90 disabled:opacity-40"
              >
                Upload &amp; link
              </button>
            </div>
          </>
        )}

        {(phase.kind === "uploading" || phase.kind === "linking") && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 size={24} className="animate-spin text-[#17191c]" />
            <p className="text-xs lg:text-[13px] text-[#17191c]">
              {phase.kind === "uploading"
                ? `Uploading ${phase.done} of ${phase.total}…`
                : "Linking photos to properties…"}
            </p>
          </div>
        )}

        {phase.kind === "done" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2">
              {phase.unmatched === 0 ? (
                <CheckCircle2
                  size={18}
                  className="text-green-600 shrink-0 mt-0.5"
                />
              ) : (
                <XCircle
                  size={18}
                  className="text-amber-600 shrink-0 mt-0.5"
                />
              )}
              <div>
                <p className="text-sm text-[#17191c] font-medium">
                  Linked {phase.linked} photo
                  {phase.linked === 1 ? "" : "s"}
                  {phase.unmatched > 0
                    ? `; ${phase.unmatched} could not be matched`
                    : ""}
                  .
                </p>
                {phase.unmatched > 0 && (
                  <p className="text-xs text-[#777b86] mt-1">
                    Names must look like{" "}
                    <span className="">{phase.example}</span> and
                    match an existing property_ref.
                  </p>
                )}
              </div>
            </div>

            {unmatchedResults.length > 0 && (
              <div className="border border-[#e8e6e3] rounded-xl max-h-48 overflow-y-auto divide-y divide-[#e8e6e3]">
                {unmatchedResults.map((r) => (
                  <div
                    key={r.fileName + r.url}
                    className="px-3 py-2 text-xs flex flex-col gap-0.5"
                  >
                    <span className="font-medium text-[#17191c] truncate">
                      {r.fileName}
                    </span>
                    <span className="text-[#777b86]">
                      {r.message ?? r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setPhase({ kind: "choose" });
                  setFileError(null);
                }}
                className="h-9 px-4 rounded-lg border border-[#e8e6e3] text-xs lg:text-[13px] hover:bg-[#f2f0ed]"
              >
                Upload more
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="h-9 px-5 rounded-lg bg-[#17191c] text-white text-xs lg:text-[13px] hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}