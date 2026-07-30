import { useRef, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode[];
  gap?:     number; // px between items
  className?: string;
}

// Mouse-drag horizontal scroll that loops infinitely instead of
// stopping at the end. Mechanism: render the children 3x back to back
// (enough duplication that a full drag never runs out of content in
// either direction), track raw translateX ourselves instead of native
// scroll (native overflow-x scroll can't be wrapped seamlessly without
// a visible jump), and when translateX crosses one full copy's width,
// silently subtract/add that width, the visual position looks
// unchanged but we've quietly rewound back into the middle copy so
// there's always more content to drag toward on either side.
export default function InfiniteDragRow({ children, gap = 20, className = "" }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [setWidth, setSetWidth] = useState(0);
  const [x, setX] = useState(0);
  const dragState = useRef<{ dragging: boolean; startX: number; startTranslate: number; totalDelta: number }>({
    dragging: false, startX: 0, startTranslate: 0, totalDelta: 0,
  });

  // Measure one copy's width (children count is fixed, so this only
  // needs recomputing on resize, not every render).
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const oneSetWidth = track.scrollWidth / 3; // we render 3 copies
    setSetWidth(oneSetWidth);
    // Start centered on the middle copy, so there's a full copy's
    // worth of drag room in both directions from the start.
    setX((prev) => (prev === 0 ? -oneSetWidth : prev));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const wrap = useCallback((value: number) => {
    if (!setWidth) return value;
    // Keep translateX within [-2*setWidth, 0], wrapping by exactly one
    // set width at a time so the jump is imperceptible, the content at
    // the wrap point is identical between copies.
    let v = value;
    while (v <= -2 * setWidth) v += setWidth;
    while (v > 0) v -= setWidth;
    return v;
  }, [setWidth]);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragState.current = { dragging: true, startX: e.clientX, startTranslate: x, totalDelta: 0 };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    const delta = e.clientX - dragState.current.startX;
    dragState.current.totalDelta = Math.abs(delta);
    setX(wrap(dragState.current.startTranslate + delta));
  };

  const handlePointerUp = () => {
    dragState.current.dragging = false;
  };

  // A drag past this threshold means the pointer-up wasn't a genuine
  // click, suppress it on the way down to the actual card underneath
  // so dragging past a property card doesn't accidentally navigate
  // into it.
  const CLICK_SUPPRESS_THRESHOLD_PX = 6;
  const handleClickCapture = (e: React.MouseEvent) => {
    if (dragState.current.totalDelta > CLICK_SUPPRESS_THRESHOLD_PX) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <div
      className={`overflow-hidden select-none ${className}`}
      style={{ cursor: dragState.current.dragging ? "grabbing" : "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClickCapture={handleClickCapture}
    >
      <div
        ref={trackRef}
        className="flex"
        style={{
          gap,
          transform: `translateX(${x}px)`,
          transition: dragState.current.dragging ? "none" : "transform 0.15s ease-out",
        }}
      >
        {[0, 1, 2].map((copy) => (
          <div key={copy} className="flex shrink-0" style={{ gap }}>
            {children.map((child, i) => (
              <div key={`${copy}-${i}`} className="shrink-0 pointer-events-auto" draggable={false}>
                {child}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}