import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
// import type { UserRoleAssignment } from "@/types/api";

interface Props {
//   assignment: UserRoleAssignment;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isRevoking: boolean;
}

export default function RevokeRoleModal({
  onClose,
  onConfirm,
  isRevoking,
}: Props) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <div className="h-[100vh] bg-[#16161639] inset-0 backdrop-blur-sm w-full fixed top-0 left-0 z-[5000] flex items-end md:items-center justify-end md:justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2 }}
        className="w-full md:w-[420px] rounded-2xl p-6 flex flex-col gap-5 bg-white"
      >
        <div>
          <h3 className="text-base font-medium text-[#17191c]">
            Remove Member
          </h3>
          <p className="text-xs lg:text-[13px] text-[#777b86] mt-1">
            This action is irreversible. Removing this member will permanently
            revoke their access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isRevoking}
            className="flex-1 h-10 text-xs lg:text-[13px] rounded-lg text-[#4c4c4c] border border-[#e8e6e3] hover:bg-[#f2f0ed] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isRevoking}
            className="flex-1 h-10 text-xs lg:text-[13px] rounded-lg bg-red-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRevoking ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Removing...
              </>
            ) : (
              "Remove"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
