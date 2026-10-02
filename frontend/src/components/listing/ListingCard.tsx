import "@/design/tokens.css";
import { Link } from "react-router-dom";
import { Bath, BedDouble, MapPin, Sparkles, Users } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import CardCarousel from "./CardCarousel";
import SaveButton from "./SaveButton";
import type { ListingCardModel } from "./toListingCard";

interface Props {
  listing: ListingCardModel;
  isSaved?: boolean;
}

const SPEC_ICON = { bed: BedDouble, bath: Bath, guests: Users } as const;

/**
 * Card anatomy matches the reference: framed photo with type pill and heart,
 * then title, location, two chips and nightly price.
 *
 * Radii are concentric: frame 20px = photo 14px + 6px padding.
 * The title is the one focusable link; its ::after covers the text block.
 * Photos are separate mouse-only links so swiping the rail still works.
 */
export default function ListingCard({ listing, isSaved = false }: Props) {
  const { name, href, typeLabel, images, location, price, priceIsFrom, spec, amenity } = listing;
  const SpecIcon = spec ? SPEC_ICON[spec.kind] : null;

  return (
    <article className="mkt group/card flex min-w-0 flex-col gap-3.5">
      <div className="relative rounded-[20px] bg-[var(--mk-surface)] p-1.5 shadow-[var(--mk-shadow-border)] transition-[box-shadow] duration-150 ease-out group-hover/card:shadow-[var(--mk-shadow-border-hover)]">
        <CardCarousel images={images} href={href} alt={name} />
        {typeLabel && (
          <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[0.8125rem] font-[600] text-[var(--mk-ink)] shadow-[var(--mk-shadow-border)]">
            {typeLabel}
          </span>
        )}
        <div className="absolute right-2.5 top-2.5">
          <SaveButton propertyId={listing.id} propertyName={name} isSaved={isSaved} />
        </div>
      </div>

      <div className="relative flex min-w-0 flex-col gap-2.5 px-0.5">
        <div className="min-w-0">
          <h3 className="truncate text-[1.0625rem] font-[600] tracking-[-0.01em] text-[var(--mk-ink)]">
            <Link
              to={href}
              className="outline-none after:absolute after:inset-0 after:rounded-[12px] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--mk-lagoon)]"
            >
              {name}
            </Link>
          </h3>
          {location && (
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[0.875rem] text-[var(--mk-muted)]">
              <MapPin size={15} strokeWidth={1.75} className="shrink-0 text-[var(--mk-faint)]" aria-hidden="true" />
              <span className="truncate">{location}</span>
            </p>
          )}
        </div>

        {(spec || amenity) && (
          <ul className="flex min-w-0 flex-wrap gap-2" aria-label="Highlights">
            {spec && SpecIcon && (
              <li className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--mk-line)] bg-[var(--mk-surface)] pe-3.5 ps-3 text-[0.8125rem] font-[540]">
                <SpecIcon size={16} strokeWidth={1.75} className="text-[var(--mk-muted)]" aria-hidden="true" />
                {spec.label}
              </li>
            )}
            {amenity && (
              <li className="inline-flex h-9 min-w-0 items-center gap-1.5 rounded-full border border-[var(--mk-line)] bg-[var(--mk-surface)] pe-3.5 ps-3 text-[0.8125rem] font-[540]">
                <Sparkles size={15} strokeWidth={1.75} className="shrink-0 text-[var(--mk-muted)]" aria-hidden="true" />
                <span className="truncate">{amenity.label}</span>
                {amenity.more > 0 && (
                  <span className="mk-num shrink-0 text-[var(--mk-muted)]">
                    +{amenity.more}
                    <span className="sr-only"> more amenities</span>
                  </span>
                )}
              </li>
            )}
          </ul>
        )}

        <p className="mk-num text-[1.125rem] font-[650] tracking-[-0.01em] text-[var(--mk-ink)]">
          {price != null ? (
            <>
              {priceIsFrom && <span className="text-[0.875rem] font-[450] text-[var(--mk-muted)]">from </span>}
              {formatCurrency(price)}
              <span className="text-[0.875rem] font-[450] text-[var(--mk-muted)]"> /night</span>
            </>
          ) : (
            <span className="text-[0.9375rem] font-[500] text-[var(--mk-muted)]">Price on request</span>
          )}
        </p>
      </div>
    </article>
  );
}
