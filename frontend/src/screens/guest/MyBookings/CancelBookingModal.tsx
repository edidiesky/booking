import { useState }    from "react";
import { X }           from "lucide-react";

interface Props {
  bookingRef:  string;
  isLoading:   boolean;
  onConfirm:   (reason?: string) => void;
  onClose:     () => void;
}

export default function CancelBookingModal({ bookingRef, isLoading, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
         style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl p-6 flex flex-col gap-5"
           style={{ boxShadow: "var(--shadow-steep)" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--color-ink)" }}>
            Cancel booking
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#f2f0ed] transition-colors">
            <X size={16} style={{ color: "var(--color-muted-stone)" }} />
          </button>
        </div>

        <p className="text-sm" style={{ color: "var(--color-muted-stone)" }}>
          Are you sure you want to cancel{" "}
          <span style={{ color: "var(--color-ink)" }}>{bookingRef}</span>?
          A refund may apply based on the cancellation policy.
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest"
                 style={{ color: "var(--color-hint-of-grey)" }}>
            Reason (optional)
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us why you're cancelling..."
            className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none outline-none"
            style={{ borderColor: "#e8e6e3", color: "var(--color-ink)" }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 border rounded-full text-sm transition-opacity hover:opacity-70"
            style={{ borderColor: "#e8e6e3", color: "var(--color-muted-stone)" }}
          >
            Keep booking
          </button>
          <button
            onClick={() => onConfirm(reason || undefined)}
            disabled={isLoading}
            className="flex-1 h-11 rounded-full text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ backgroundColor: "#dc2626", color: "#fff" }}
          >
            {isLoading ? "Cancelling..." : "Yes, cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}