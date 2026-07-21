import { motion } from "framer-motion";
import { X } from "lucide-react";

interface Props { open: boolean; onClose: () => void; children: React.ReactNode; }

export default function FilterPanel({ open, onClose, children }: Props) {
  return (
    <motion.div
      initial={false}
      animate={{ x: open ? 0 : "-100%" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 h-full w-[320px] bg-white border-r border-[#e8e6e3] z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e6e3]">
        <p className="text-sm font-semibold text-[#17191c]">Filters</p>
        <button onClick={onClose}><X size={16} /></button>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}