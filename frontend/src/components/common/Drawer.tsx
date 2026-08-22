import { motion } from "framer-motion";
import { X } from "lucide-react";

interface DrawerProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  widthClass?: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function Drawer({
  title,
  subtitle,
  onClose,
  widthClass = "lg:w-[750px]",
  isLoading,
  children,
}: DrawerProps) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-base p-4 flex items-center justify-end z-50">
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`bg-white relative w-full rounded-2xl overflow-hidden flex flex-col h-[95vh] ${widthClass}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e6e3]">
          <div>
            <p className="text-xs lg:text-[13px]     text-[#17191c]">{title}</p>
            {subtitle && (
              <p className="text-xs lg:text-[13px]     text-[#777b86] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#f2f0ed] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 flex overflow-y-auto flex-col gap-2">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs lg:text-[13px]     text-[#777b86]">Loading...</p>
            </div>
          ) : (
            children
          )}
        </div>
      </motion.div>
    </div>
  );
}