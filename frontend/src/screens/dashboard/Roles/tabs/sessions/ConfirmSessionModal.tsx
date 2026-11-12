import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import type { UserSession } from "@/redux/services/sessionApi";

export type PendingAction =
  | { kind: "one"; session: UserSession }
  | { kind: "others"; count: number }
  | { kind: "all" };

interface Props {
  action: PendingAction;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isWorking: boolean;
}

function copyFor(action: PendingAction): {
  title: string;
  body: string;
  confirmLabel: string;
  workingLabel: string;
} {
  switch (action.kind) {
    case "one":
      return {
        title: "Log out this device?",
        body: `${action.session.deviceLabel} will be signed out immediately and will need to log in again.`,
        confirmLabel: "Log out device",
        workingLabel: "Logging out...",
      };
    case "others":
      return {
        title: "Log out other devices?",
        body: `${action.count} other device${action.count === 1 ? "" : "s"} will be signed out. This device stays signed in.`,
        confirmLabel: "Log out others",
        workingLabel: "Logging out...",
      };
    case "all":
      return {
        title: "Log out everywhere?",
        body: "Every device, including this one, will be signed out. You will need to sign in again.",
        confirmLabel: "Log out everywhere",
        workingLabel: "Logging out...",
      };
  }
}

export default function ConfirmSessionModal({
  action,
  onClose,
  onConfirm,
  isWorking,
}: Props) {
  const copy = copyFor(action);

  return (
    <div
      className="h-[100vh] bg-[#16161639] inset-0 backdrop-blur-sm w-full fixed top-0 left-0 z-[5000] flex items-end md:items-center justify-end md:justify-center px-4"
      onClick={() => {
        if (!isWorking) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-session-title"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full md:w-[420px] rounded-2xl p-6 flex flex-col gap-5 bg-white"
      >
        <div>
          <h3
            id="confirm-session-title"
            className="text-base font-medium text-[#17191c]"
          >
            {copy.title}
          </h3>
          <p className="text-xs lg:text-[13px] text-[#777b86] mt-1">
            {copy.body}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isWorking}
            className="flex-1 h-10 text-xs lg:text-[13px] rounded-lg text-[#4c4c4c] border border-[#e8e6e3] hover:bg-[#f2f0ed] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isWorking}
            className="flex-1 h-10 text-xs lg:text-[13px] rounded-lg bg-red-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isWorking ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                {copy.workingLabel}
              </>
            ) : (
              copy.confirmLabel
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
