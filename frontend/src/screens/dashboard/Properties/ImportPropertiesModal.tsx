import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  MapPinOff,
  X,
} from "lucide-react";
import { showToast } from "@/components/common/Toast";
import { PROPERTY_IMPORT_TEMPLATE_URL } from "@/constants/api";
import { uploadSignedRawFile } from "@/redux/services/cloudinaryAPI";
import {
  useGetImportUploadSignatureMutation,
  useStartPropertyImportMutation,
  type ImportRowError,
  type ImportStage,
} from "@/redux/services/propertyImportApi";
import { usePropertyImportStream } from "@/hooks/usePropertyImportStream";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const TEMPLATE_FILENAME = "property-import-template.csv";

const STAGE_LABEL: Record<ImportStage, string> = {
  queued: "Waiting to start",
  downloading: "Reading your file",
  validating: "Checking every row",
  importing: "Creating properties",
  completed: "Import finished",
  failed: "Import stopped",
};

type Phase =
  | { kind: "choose" }
  | { kind: "uploading"; percent: number }
  | { kind: "ready"; publicId: string }
  | { kind: "running"; batchId: string };

function saveBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

// The HTML download attribute is ignored for links to another domain, so a
// plain link to Cloudinary may open the CSV as text. Fetch and save instead;
// fall back to opening the link if the fetch is blocked.
async function downloadTemplate() {
  if (!PROPERTY_IMPORT_TEMPLATE_URL) {
    showToast("The import template is not configured yet.", "error");
    return;
  }
  try {
    const res = await fetch(PROPERTY_IMPORT_TEMPLATE_URL);
    if (!res.ok) throw new Error(String(res.status));
    saveBlob(await res.blob(), TEMPLATE_FILENAME);
  } catch {
    window.open(PROPERTY_IMPORT_TEMPLATE_URL, "_blank", "noopener");
  }
}

async function readHeader(blob: Blob): Promise<string[]> {
  const text = await blob.slice(0, 64 * 1024).text();
  const first = text.replace(/^\uFEFF/, "").split(/\r?\n/)[0] ?? "";
  return first.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
}

// Compares against the hosted template itself, so this check can never
// disagree with the file sellers download. If the template cannot be
// fetched, skip: the server validates headers anyway.
async function checkHeaders(file: File): Promise<string | null> {
  if (!PROPERTY_IMPORT_TEMPLATE_URL) return null;
  let expected: string[];
  try {
    const res = await fetch(PROPERTY_IMPORT_TEMPLATE_URL);
    if (!res.ok) return null;
    expected = await readHeader(await res.blob());
  } catch {
    return null;
  }
  const actual = await readHeader(file);
  const missing = expected.filter((h) => h && !actual.includes(h));
  return missing.length
    ? `This file is missing template columns: ${missing.join(", ")}. Download the template and copy your data into it.`
    : null;
}

function downloadErrorReport(errors: ImportRowError[]) {
  const esc = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [
    "row,property_ref,column,problem",
    ...errors.map((e) =>
      [String(e.row), e.propertyRef ?? "", e.column ?? "", e.message]
        .map(esc)
        .join(","),
    ),
  ];
  saveBlob(
    new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv" }),
    "import-errors.csv",
  );
}

interface Props {
  onClose: () => void;
}

export default function ImportPropertiesModal({ onClose }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: "choose" });
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const uploadAbort = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [getSignature] = useGetImportUploadSignatureMutation();
  const [startImport, { isLoading: isStarting }] =
    useStartPropertyImportMutation();
  const { snapshot, connection } = usePropertyImportStream(
    phase.kind === "running" ? phase.batchId : null,
  );

  const reset = () => {
    uploadAbort.current?.abort();
    setFile(null);
    setFileError(null);
    setPhase({ kind: "choose" });
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    // Closing during "running" is fine: the import continues on the server.
    uploadAbort.current?.abort();
    onClose();
  };

  const onFileChosen = async (f: File) => {
    setFileError(null);
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setFileError("Choose a .csv file.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setFileError("The file is larger than 5MB. Split it into smaller files.");
      return;
    }
    const headerProblem = await checkHeaders(f);
    if (headerProblem) {
      setFileError(headerProblem);
      return;
    }

    setFile(f);
    const controller = new AbortController();
    uploadAbort.current = controller;
    setPhase({ kind: "uploading", percent: 0 });
    try {
      const sig = await getSignature().unwrap();
      await uploadSignedRawFile(
        f,
        sig,
        (p) => setPhase({ kind: "uploading", percent: p.percent }),
        controller.signal,
      );
      // Use the id we signed, not one echoed back by the upload response.
      setPhase({ kind: "ready", publicId: sig.publicId });
    } catch (err) {
      if (controller.signal.aborted) return;
      setFileError((err as Error).message || "Upload failed. Try again.");
      setFile(null);
      setPhase({ kind: "choose" });
    }
  };

  const onSend = async () => {
    if (phase.kind !== "ready") return;
    try {
      const batch = await startImport({
        filePublicId: phase.publicId,
        fileName: file?.name,
      }).unwrap();
      setPhase({ kind: "running", batchId: batch.batchId });
    } catch {
      /* rtkQueryErrorMiddleware shows the error */
    }
  };

  const status = snapshot?.status;
  const done = status === "completed" || status === "failed";
  const totals = snapshot?.totals;

  return (
    <div
      className="h-[100vh] bg-[#16161639] inset-0 backdrop-blur-sm w-full fixed top-0 left-0 z-[5000] flex items-end md:items-center justify-center px-4"
      onClick={handleClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-properties-title"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full md:w-[520px] max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 flex flex-col gap-5 lg:gap-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id="import-properties-title"
              className="text-base lg:text-lg font-medium text-[#17191c]"
            >
              Import properties <br /> and room types
            </h3>
            <p className="text-xs lg:text-[13px] text-[#777b86] mt-1">
              One row per room type. Repeat the property details on every room
              row of the same property. Imported properties are created as
              drafts.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="p-1 rounded-lg hover:bg-[#f2f0ed]"
          >
            <X size={16} />
          </button>
        </div>

        {phase.kind !== "running" && (
          <>
            <button
              type="button"
              onClick={() => void downloadTemplate()}
              className="self-start h-9 px-4 rounded-lg border border-[#e8e6e3] text-xs lg:text-[13px] inline-flex items-center gap-2 hover:bg-[#f2f0ed]"
            >
              <Download size={14} />
              Download template
            </button>

            <label
              className={`border border-dashed rounded-xl p-6 flex flex-col items-center gap-2 text-center ${
                phase.kind === "choose"
                  ? "cursor-pointer hover:bg-[#fafaf9]"
                  : "opacity-80"
              }`}
              style={{ borderColor: fileError ? "#e5484d" : "#e8e6e3" }}
            >
              <FileUp size={20} className="text-[#777b86]" />
              <span className="text-xs lg:text-[13px] text-[#17191c]">
                {file ? file.name : "Choose your filled-in CSV file"}
              </span>
              <span className="text-[11px] text-[#a3a6af]">
                Save from Excel as "CSV UTF-8 (Comma delimited)". Max 5MB, 2,000
                rows.
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                disabled={phase.kind !== "choose"}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFileChosen(f);
                }}
              />
            </label>

            {fileError && (
              <p className="text-xs lg:text-[13px] text-[#c0392b]">
                {fileError}
              </p>
            )}

            {phase.kind === "uploading" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs text-[#777b86]">
                  <span>Uploading</span>
                  <span>{phase.percent}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#f2f0ed] overflow-hidden">
                  <div
                    className="h-full bg-[#17191c] transition-all"
                    style={{ width: `${phase.percent}%` }}
                  />
                </div>
              </div>
            )}

            {phase.kind === "ready" && (
              <p className="text-xs lg:text-[13px] text-[#1a7a3f] inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} /> File uploaded. Send it to start the
                import.
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={reset}
                disabled={phase.kind === "choose"}
                className="flex-1 h-10 text-xs lg:text-[13px] rounded-lg border border-[#e8e6e3] hover:bg-[#f2f0ed] disabled:opacity-40"
              >
                Choose another file
              </button>
              <button
                type="button"
                onClick={() => void onSend()}
                disabled={phase.kind !== "ready" || isStarting}
                className="flex-1 h-10 text-xs lg:text-[13px] rounded-lg bg-[#17191c] text-white disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                {isStarting && <Loader2 size={13} className="animate-spin" />}
                Send
              </button>
            </div>
          </>
        )}

        {phase.kind === "running" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-[#777b86]">
                <span className="inline-flex items-center gap-1.5">
                  {!done && <Loader2 size={12} className="animate-spin" />}
                  {snapshot ? STAGE_LABEL[snapshot.status] : "Connecting"}
                </span>
                <span>
                  {connection === "reconnecting"
                    ? "Reconnecting..."
                    : `${snapshot?.progress ?? 0}%`}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#f2f0ed] overflow-hidden">
                <div
                  className={`h-full transition-all ${status === "failed" ? "bg-[#c0392b]" : "bg-[#17191c]"}`}
                  style={{ width: `${snapshot?.progress ?? 0}%` }}
                />
              </div>
              {!done && (
                <p className="text-[11px] text-[#a3a6af]">
                  You can close this window. The import keeps running.
                </p>
              )}
            </div>

            {status === "failed" && snapshot?.failureReason && (
              <p className="text-xs lg:text-[13px] text-[#c0392b] inline-flex items-start gap-1.5">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />{" "}
                {snapshot.failureReason}
              </p>
            )}

            {totals && totals.propertiesInFile !== undefined && (
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  [
                    "Created",
                    totals.created ??
                      snapshot?.createdProperties.filter(
                        (p) => !p.skippedExisting,
                      ).length ??
                      0,
                  ],
                  ["Already existed", totals.skippedExisting ?? 0],
                  ["Need fixing", totals.failed ?? 0],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-xl border border-[#e8e6e3] p-3"
                  >
                    <p className="text-lg font-medium text-[#17191c]">
                      {value}
                    </p>
                    <p className="text-[11px] text-[#777b86]">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {(snapshot?.createdProperties.length ?? 0) > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-[#17191c]">Properties</p>
                <ul className="max-h-48 overflow-y-auto divide-y divide-[#f2f0ed] border border-[#e8e6e3] rounded-xl">
                  {snapshot!.createdProperties.map((p) => (
                    <li
                      key={p.ref}
                      className="px-3 py-2 flex items-center justify-between gap-2 text-xs lg:text-[13px]"
                    >
                      <span className="truncate">
                        <span className=" text-[#777b86]">
                          {p.ref}
                        </span>
                        {p.skippedExisting
                          ? " already existed, skipped"
                          : ` created with ${p.rooms} room type${p.rooms === 1 ? "" : "s"}`}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        {p.missingCoordinates && !p.skippedExisting && (
                          <span
                            title="No coordinates: set the location before publishing"
                            className="text-[#b45309]"
                          >
                            <MapPinOff size={13} />
                          </span>
                        )}
                        <Link
                          to={`/dashboard/properties/${p.propertyId}`}
                          className="underline underline-offset-4 text-[#17191c]"
                        >
                          Open
                        </Link>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(snapshot?.errors.length ?? 0) > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#17191c]">
                    {snapshot!.errors.length} problem
                    {snapshot!.errors.length === 1 ? "" : "s"} to fix
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadErrorReport(snapshot!.errors)}
                    className="text-xs underline underline-offset-4 text-[#17191c]"
                  >
                    Download error report
                  </button>
                </div>
                <ul className="max-h-48 overflow-y-auto border border-[#e8e6e3] rounded-xl divide-y divide-[#f2f0ed]">
                  {snapshot!.errors.slice(0, 50).map((e, i) => (
                    <li
                      key={`${e.row}-${e.column ?? ""}-${i}`}
                      className="px-3 py-2 text-xs"
                    >
                      <span className="text-[#777b86]">
                        Row {e.row}
                        {e.column ? `, ${e.column}` : ""}:{" "}
                      </span>
                      {e.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {done && (
              <div className="flex flex-col gap-2">
                {status === "completed" && (
                  <p className="text-xs lg:text-[13px] text-[#777b86]">
                    Imported properties are drafts. Open each one to add photos
                    and publish it.
                    {(totals?.failed ?? 0) > 0 &&
                      " Fix the rows in the error report and send the same file again: properties already imported will be skipped."}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={reset}
                    className="flex-1 h-10 text-xs lg:text-[13px] rounded-lg border border-[#e8e6e3] hover:bg-[#f2f0ed]"
                  >
                    Import another file
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 h-10 text-xs lg:text-[13px] rounded-lg bg-[#17191c] text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
