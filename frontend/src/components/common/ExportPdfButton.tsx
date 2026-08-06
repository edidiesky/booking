import { useState } from "react";
import { Download, Loader2, FileDown } from "lucide-react";
import { useTriggerExportMutation } from "@/redux/services/exportApi";
import { useJobStream } from "@/hooks/useJobStream";
import type { JobState } from "@/redux/services/roomImportApi";
import { showToast } from "@/components/common/Toast";

interface Props {
  triggerUrl: string;
  label?:     string;
}

export default function ExportPdfButton({ triggerUrl, label = "Export PDF" }: Props) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobState, setJobState] = useState<JobState | null>(null);
  const [triggerExport, { isLoading: starting }] = useTriggerExportMutation();

  useJobStream("pdf_export", jobId, (state) => {
    setJobState(state);
    if (state.state === "done" && state?.result?.pdfUrl) {
      window.open(state?.result.pdfUrl, "_blank", "noopener,noreferrer");
    }
    if (state.state === "error") {
      showToast(state.error ?? "Export failed, try again.", "error");
    }
  });

  const isRunning = jobState?.state === "queued" || jobState?.state === "processing";

  const handleClick = async () => {
    if (isRunning || starting) return;
    try {
      const result = await triggerExport(triggerUrl).unwrap();
      setJobState({ jobId: result.data.jobId, jobType: "pdf_export", state: "queued", progress: 0, updatedAt: new Date().toISOString() });
      setJobId(result.data.jobId);
    } catch {
      showToast("Couldn't start the export, try again.", "error");
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isRunning || starting}
      className="flex items-center gap-1.5 h-9 px-4 rounded-full text-xs lg:text-sm border transition-colors hover:bg-[#f2f0ed] disabled:opacity-60"
      style={{ borderColor: "#e8e6e3", color: "#17191c" }}
    >
      {isRunning ? (
        <>
          <Loader2 size={13} className="animate-spin" />
          {jobState?.state === "queued" ? "Queued..." : `Exporting... ${jobState?.progress ?? 0}%`}
        </>
      ) : jobState?.state === "done" ? (
        <>
          <Download size={13} />
          Downloaded, export again
        </>
      ) : (
        <>
          <FileDown size={13} />
          {label}
        </>
      )}
    </button>
  );
}