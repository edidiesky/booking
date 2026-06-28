import { useState }     from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

interface Props { images: string[]; name: string; }

export default function PropertyImages({ images, name }: Props) {
  const [active, setActive] = useState(0);
  const prev = () => setActive((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setActive((i) => (i === images.length - 1 ? 0 : i + 1));

  if (!images.length) {
    return (
      <div className="w-full h-[360px] rounded-2xl flex items-center justify-center"
           style={{ backgroundColor: "var(--color-fog)" }}>
        <MapPin size={32} style={{ color: "var(--color-hint-of-grey)" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full h-[420px] rounded-2xl overflow-hidden">
        <img src={images[active]} alt={name}
             className="w-full h-full object-cover" />
        {images.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
              style={{ backgroundColor: "var(--color-canvas)" }}>
              <ChevronLeft size={18} style={{ color: "var(--color-ink)" }} />
            </button>
            <button onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
              style={{ backgroundColor: "var(--color-canvas)" }}>
              <ChevronRight size={18} style={{ color: "var(--color-ink)" }} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setActive(i)}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: i === active ? "var(--color-canvas)" : "rgba(255,255,255,0.5)" }} />
              ))}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors"
              style={{ borderColor: i === active ? "var(--color-ink)" : "transparent" }}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}