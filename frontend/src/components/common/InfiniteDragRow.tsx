import { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { ReactNode } from "react";

interface Props {
  children:  ReactNode[];
  gap?:      number; // px between items
  className?: string;
}

export default function InfiniteDragRow({ children, gap = 20, className = "" }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    dragFree: true,   
    align: "start",
    containScroll: false,
  });

  // Re-measure on children changes (e.g. property list finishes
  // loading after the row already mounted with a skeleton).
  useEffect(() => {
    emblaApi?.reInit();
  }, [children.length, emblaApi]);

  return (
    <div className={`overflow-hidden select-none ${className}`} ref={emblaRef} style={{ cursor: "grab" }}>
      <div className="flex " style={{ gap }}>
        {children.map((child, i) => (
          <div key={i} className="shrink-0" draggable={false}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}