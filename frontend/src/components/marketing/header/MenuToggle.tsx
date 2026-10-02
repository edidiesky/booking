import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ICON_SWAP } from "@/design/motion";

export default function MenuToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="mobile-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      className="grid h-12 w-12 place-items-center rounded-full border border-[var(--mk-line)] text-[var(--mk-ink)] transition-[background-color,scale] duration-150 ease-out hover:bg-black/[0.04] active:scale-[0.96] xl:hidden"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span key={open ? "x" : "menu"} {...ICON_SWAP} className="grid place-items-center">
          {open ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
