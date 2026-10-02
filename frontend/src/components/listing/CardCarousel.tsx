import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { cdnImage, cdnSrcSet } from "@/utils/cdnImage";

interface Props {
  images: string[];
  href: string;
  alt: string;
}

const SIZES =
  "(min-width: 1280px) 290px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw";


export default function CardCarousel({ images, href, alt }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [reach, setReach] = useState(0); // highest index allowed to load
  const ticking = useRef(false);
  const count = images.length;

  const onScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      const rail = railRef.current;
      if (!rail || rail.clientWidth === 0) return;
      const i = Math.round(rail.scrollLeft / rail.clientWidth);
      setIndex(i);
    });
  }, []);

  useEffect(() => {
    setReach((r) => Math.max(r, Math.min(index + 1, count - 1)));
  }, [index, count]);

  const go = (dir: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rail = railRef.current;
    if (!rail) return;
    setReach((r) => Math.max(r, Math.min(index + 2, count - 1)));
    rail.scrollTo({
      left: (index + dir) * rail.clientWidth,
      behavior: "smooth",
    });
  };

  if (count === 0) {
    return (
      <Link
        to={href}
        tabIndex={-1}
        aria-hidden="true"
        className="grid aspect-square w-full place-items-center rounded-[14px] bg-[var(--mk-paper)] text-[var(--mk-faint)]"
      >
        <ImageOff size={28} strokeWidth={1.5} />
      </Link>
    );
  }

  return (
    <div className="group/car relative aspect-square w-full overflow-hidden rounded-[14px] bg-[var(--mk-paper)]">
      <div ref={railRef} onScroll={onScroll} className="mk-rail h-full w-full">
        {images.map((src, i) => (
          <Link
            key={src}
            to={href}
            tabIndex={-1}
            aria-hidden="true"
            draggable={false}
            className="block h-full w-full"
          >
            {i <= reach ? (
              <img
                src={cdnImage(src, 520)}
                srcSet={cdnSrcSet(src, [360, 520, 720])}
                sizes={SIZES}
                alt={i === 0 ? alt : ""}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="mk-img-outline h-full w-full rounded-[14px] object-cover"
              />
            ) : (
              <span className="block h-full w-full" />
            )}
          </Link>
        ))}
      </div>

      {count > 1 && (
        <>
          {/* Arrows: precise pointers only, shown on hover or keyboard focus. */}
          <div className="pointer-events-none absolute inset-x-2 top-1/2 hidden -translate-y-1/2 justify-between [@media(pointer:fine)]:flex">
            <ArrowBtn label="Previous photo" show={index > 0} onClick={go(-1)}>
              <ChevronLeft
                size={18}
                strokeWidth={2}
                className="-translate-x-px"
              />
            </ArrowBtn>
            <ArrowBtn
              label="Next photo"
              show={index < count - 1}
              onClick={go(1)}
            >
              <ChevronRight
                size={18}
                strokeWidth={2}
                className="translate-x-px"
              />
            </ArrowBtn>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5"
          >
            {images.slice(0, 5).map((src, i) => {
              const on = Math.min(index, 4) === i;
              return (
                <span
                  key={src}
                  className="h-1.5 rounded-full bg-white"
                  style={{
                    width: on ? 14 : 6,
                    opacity: on ? 1 : 0.6,
                    boxShadow: "0 0 0 0.5px rgba(0,0,0,0.15)",
                    transition:
                      "width 200ms var(--mk-ease-out), opacity 200ms ease-out",
                  }}
                />
              );
            })}
          </div>
          <span
            className="sr-only"
            aria-live="polite"
          >{`Photo ${index + 1} of ${count}`}</span>
        </>
      )}
    </div>
  );
}

function ArrowBtn({
  label,
  show,
  onClick,
  children,
}: {
  label: string;
  show: boolean;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      tabIndex={show ? 0 : -1}
      className="pointer-events-auto grid h-8 w-8 place-items-center rounded-full bg-white/95 text-[var(--mk-ink)] opacity-0 shadow-[var(--mk-shadow-border)] transition-[opacity,scale] duration-150 ease-out focus-visible:opacity-100 active:scale-[0.96] group-hover/car:opacity-100 data-[hide=true]:!opacity-0 data-[hide=true]:pointer-events-none"
      data-hide={!show}
    >
      {children}
    </button>
  );
}
