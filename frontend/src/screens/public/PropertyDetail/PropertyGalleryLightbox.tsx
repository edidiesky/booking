import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Share2, Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  images:  string[];
  index:   number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export default function PropertyGalleryLightbox({ images, index, onClose, onIndexChange }: Props) {
  const goPrev = useCallback(() => onIndexChange((index - 1 + images.length) % images.length), [index, images.length, onIndexChange]);
  const goNext = useCallback(() => onIndexChange((index + 1) % images.length), [index, images.length, onIndexChange]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [goPrev, goNext, onClose]);

  return (
    <div className="fixed inset-0 z-[6000] bg-black flex flex-col" data-lenis-prevent>
      <div className="flex items-center justify-between px-6 py-5 shrink-0">
        <button onClick={onClose} className="flex items-center gap-2 text-white text-sm">
          <X size={18} />
          Close
        </button>
        <p className="text-white text-sm">{index + 1} / {images.length}</p>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-full flex items-center justify-center border border-white/30 text-white hover:bg-white/10">
            <Share2 size={15} />
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center border border-white/30 text-white hover:bg-white/10">
            <Heart size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center px-6 pb-6 min-h-0">
        {images.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-4 lg:left-8 w-11 h-11 rounded-full bg-white flex items-center justify-center hover:opacity-90"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={images[index]}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-h-full max-w-full object-contain rounded-lg"
          />
        </AnimatePresence>

        {images.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 lg:right-8 w-11 h-11 rounded-full bg-white flex items-center justify-center hover:opacity-90"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}