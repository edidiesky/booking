import { Link } from "react-router-dom";
import { cdnImage } from "@/utils/cdnImage";

/** Last tile in the grid, same frame as a card so the row stays aligned. */
export default function SeeMoreTile({ images, to = "/search" }: { images: string[]; to?: string }) {
  const stack = images.slice(0, 3);
  return (
    <div className="mkt flex flex-col">
      <Link
        to={to}
        className="group/more flex aspect-square flex-col items-center justify-center gap-6 rounded-[20px] bg-[var(--mk-surface)] p-6 shadow-[var(--mk-shadow-border)] transition-[box-shadow] duration-150 ease-out hover:shadow-[var(--mk-shadow-border-hover)]"
      >
        <span className="relative block h-28 w-36" aria-hidden="true">
          {stack.map((src, i) => (
            <img
              key={src}
              src={cdnImage(src, 200)}
              alt=""
              loading="lazy"
              decoding="async"
              className="mk-img-outline absolute h-20 w-24 rounded-[12px] object-cover shadow-[var(--mk-shadow-float)]"
              style={{
                left: `${i * 22}px`,
                top: `${[18, 0, 26][i]}px`,
                rotate: `${[-8, 3, 10][i]}deg`,
                zIndex: i === 1 ? 2 : 1,
              }}
            />
          ))}
          {stack.length === 0 && (
            <span className="absolute inset-0 rounded-[12px] bg-[var(--mk-paper)]" />
          )}
        </span>
        <span className="text-[1.0625rem] font-[600] text-[var(--mk-lagoon)] underline decoration-[color-mix(in_oklch,currentColor_30%,transparent)] underline-offset-4 transition-[text-decoration-color] duration-150 group-hover/more:decoration-current">
          See more stays
        </span>
      </Link>
    </div>
  );
}
