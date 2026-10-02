import { useState }  from "react";
import { motion }    from "framer-motion";
import { slide }     from "@/constants/framer";
import { Loader2 }   from "lucide-react";
import { Input }     from "@/components/ui/input";

interface Props {
  bookingRef: string;
  isLoading:  boolean;
  isOpen:     boolean;
  onConfirm:  (reason?: string) => void;
  onClose:    () => void;
}

export default function CancelBookingModal({ bookingRef, isLoading, isOpen, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState("");

  return (
    <div className="h-[100vh] bg-[#16161639] inset-0 backdrop-blur-sm w-full fixed top-0 left-0 z-[5000] flex items-end md:items-center justify-end md:justify-center px-4">
      <motion.div
        variants={slide}
        initial="initial"
        animate={isOpen ? "enter" : "exit"}
        exit="exit"
        className="w-full md:w-[500px] md:max-w-[550px] rounded-2xl pt-6 justify-between relative items-start flex flex-col gap-4 bg-white"
      >
        <div className="w-full flex px-8 items-start justify-between gap-1">
          <div>
            <h3 className="text-lg text-[#17191c]">Cancel Booking</h3>
            <p className="text-xs lg:text-[13px]     text-[#777b86] mt-1 max-w-[380px]">
              Are you sure you want to cancel{" "}
              <span className="text-[#17191c]">{bookingRef}</span>?
              A refund may apply based on the cancellation policy.
            </p>
          </div>
        </div>

        <div className="w-full px-8">
          <Input
            label="Reason (optional)"
            type="text"
            placeholder="Tell us why you're cancelling..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="w-full flex px-8 py-4 border-t border-[#e8e6e3] bg-white items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-5 text-xs lg:text-[13px]   rounded-full text-[#4c4c4c] border border-[#e8e6e3] hover:bg-[#f2f0ed] transition-colors disabled:opacity-50"
          >
            Keep booking
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason || undefined)}
            disabled={isLoading}
            className="h-9 px-5 text-xs lg:text-[13px]   rounded-full bg-red-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Cancelling...
              </>
            ) : "Yes, cancel"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}