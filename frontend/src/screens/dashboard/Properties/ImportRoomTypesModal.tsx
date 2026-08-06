import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, CheckCircle2, XCircle, X } from "lucide-react";
import { slide } from "@/constants/framer";
import { uploadRawFileToCloudinary } from "@/redux/services/cloudinaryAPI";
import { useImportRoomTypesMutation, type JobState } from "@/redux/services/roomImportApi";
import { useJobStream } from "@/hooks/useJobStream";
import { showToast } from "@/components/common/Toast";

interface Props {
  propertyId: string;
  onClose:    () => void;
}

export default function ImportRoomTypesModal({ propertyId, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobState, setJobState] = useState<JobState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importRoomTypes] = useImportRoomTypesMutation();

  useJobStream("csv_room_import", jobId, setJobState);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadRawFileToCloudinary(file);
      const result = await importRoomTypes({ propertyId, fileUrl: uploaded.secure_url }).unwrap();
      setJobState({ jobId: result.data.jobId, jobType: "csv_room_import", state: "queued", progress: 0, updatedAt: new Date().toISOString() });
      setJobId(result.data.jobId);
    } catch {
      showToast("Couldn't start the import, try again.", "error");
    } finally {
      setUploading(false);
    }
  };

  const isRunning = jobState && (jobState.state === "queued" || jobState.state === "processing");
  const isDone = jobState?.state === "done";
  const isFailed = jobState?.state === "error";

  return (
    <div className="h-[100vh] bg-[#16161639] inset-0 backdrop-blur-sm w-full fixed top-0 left-0 z-[5000] flex items-end md:items-center justify-end md:justify-center px-4">
      <motion.div
        variants={slide}
        initial="initial"
        animate="enter"
        exit="exit"
        className="w-full md:w-[500px] md:max-w-[550px] rounded-2xl pt-6 justify-between relative items-start flex flex-col gap-4 bg-white"
      >
        <div className="w-full flex px-8 items-start justify-between gap-1">
          <div>
            <h3 className="text-lg text-[#17191c]">Import room types</h3>
            <p className="text-xs lg:text-sm text-[#777b86] mt-1 max-w-[380px]">
              Upload a CSV to bulk-create room types for this property. Rows with errors are skipped and reported individually, valid rows are still imported.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#f2f0ed]">
            <X size={16} />
          </button>
        </div>

        <div className="w-full px-8 flex flex-col gap-4">
          {!jobState && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-xs lg:text-smhover:bg-[#fafaf9] transition-colors"
                style={{ borderColor: "#e8e6e3", color: "#777b86" }}
              >
                <Upload size={18} />
                {file ? file.name : "Click to choose a .csv file"}
              </button>
              <div className="text-[11px] leading-relaxed rounded-lg p-3" style={{ backgroundColor: "#fafaf9", color: "#777b86" }}>
                <p className="bold mb-1" style={{ color: "#17191c" }}>Required columns</p>
                <p>name, description, max_occupancy, base_price_ngn, quantity, amenities, images</p>
                <p className="mt-1">
                  <span className="bold">amenities</span> and <span className="bold">images</span> accept multiple values in one cell, comma-separated (e.g. "WiFi, Pool" or two image URLs separated by a comma). A broken or non-URL image entry is dropped silently, it won't fail the row.
                </p>
              </div>
            </>
          )}

          {isRunning && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "#17191c" }}>
              <Loader2 size={14} className="animate-spin" />
              {jobState.state === "queued" ? "Queued..." : `Processing... ${jobState.progress}%`}
            </div>
          )}

          {isDone && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs lg:text-sm" style={{ color: "#166534" }}>
                <CheckCircle2 size={14} />
                {jobState.succeeded ?? 0} room type{jobState.succeeded === 1 ? "" : "s"} imported
                {(jobState.failed ?? 0) > 0 && `, ${jobState.failed} row${jobState.failed === 1 ? "" : "s"} failed`}
              </div>
              {jobState.errors && jobState.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 flex flex-col gap-1" style={{ borderColor: "#f2f0ed" }}>
                  {jobState.errors.map((e, i) => (
                    <p key={i} className="text-xs" style={{ color: "#991b1b" }}>
                      Row {e.row}{e.field ? ` (${e.field})` : ""}: {e.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {isFailed && (
            <div className="flex items-center gap-2 text-xs" style={{ color: "#991b1b" }}>
              <XCircle size={14} />
              {jobState.error ?? "Import failed."}
            </div>
          )}
        </div>

        <div className="w-full flex px-8 py-4 border-t border-[#e8e6e3] items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 text-xs lg:text-sm rounded-full text-[#4c4c4c] border border-[#e8e6e3] hover:bg-[#f2f0ed] transition-colors"
          >
            {isDone || isFailed ? "Close" : "Cancel"}
          </button>
          {!jobState && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="h-9 px-5 text-xs lg:text-sm rounded-full bg-[#17191c] text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Uploading...
                </>
              ) : "Import"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}