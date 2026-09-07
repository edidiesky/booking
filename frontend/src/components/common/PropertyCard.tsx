import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  MapPin,
  Bath,
  Wifi,
  BedDouble,
  Tv,
  Car,
  Waves,
  Wind,
  UtensilsCrossed,
  WashingMachine,
  Flame,
  Dumbbell,
  KeyRound,
  PawPrint,
  TreePine,
  Shield,
  Coffee,
  Snowflake,
  Armchair,
  Zap,
  Camera,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { IoStar } from "react-icons/io5";
import { formatCurrency } from "@/utils/formatCurrency";
import { smallslideup2 } from "@/constants/framer";
import { AMENITY_OPTIONS } from "@/constants/amenities";
import FavoriteButton from "./FavoriteButton";

export interface PropertyCardData {
  id: string;
  name: string;
  images?: string[];
  amenities?: string[];
  property_type?: string;
  propertyType?: string;
  address?: {
    city?: string;
    country?: string;
    lat?: number | string;
    lng?: number | string;
  };
  city?: string;
  roomTypes?: {
    images?: string[];
    base_price_ngn: number | string;
    bedrooms?: number;
    beds?: number;
    bathrooms?: number;
  }[];
  rating?: number;
  reviewCount?: number;
  isGuestFavorite?: boolean;
  isSuperhost?: boolean;
  instantBook?: boolean;
}

export type PropertyCardVariant =
  | "default"
  | "compact"
  | "minimal"
  | "search"
  | "home";

interface Props {
  property: PropertyCardData;
  index?: number;
  isFavorited?: boolean;
  variant?: PropertyCardVariant;
}

/** id / loose label → lucide icon */
const AMENITY_ICON_MAP: Record<string, LucideIcon> = {
  wifi: Wifi,
  "wi-fi": Wifi,
  tv: Tv,
  kitchen: UtensilsCrossed,
  washer: WashingMachine,
  dryer: WashingMachine,
  ac: Snowflake,
  "air conditioning": Snowflake,
  heating: Flame,
  workspace: Armchair,
  "dedicated workspace": Armchair,
  hair_dryer: Wind,
  parking: Car,
  "free parking": Car,
  pool: Waves,
  hot_tub: Waves,
  "hot tub": Waves,
  gym: Dumbbell,
  elevator: Armchair,
  self_checkin: KeyRound,
  "self check-in": KeyRound,
  pets: PawPrint,
  "pets allowed": PawPrint,
  ev_charger: Zap,
  breakfast: Coffee,
  bathtub: Bath,
  bath: Bath,
  bathroom: Bath,
  garden: TreePine,
  bbq: Flame,
  patio: TreePine,
  balcony: TreePine,
  beach_access: Waves,
  smoke_alarm: Shield,
  carbon_monoxide: Shield,
  first_aid: LifeBuoy,
  fire_extinguisher: Flame,
  security_cameras: Camera,
  bed: BedDouble,
  bedroom: BedDouble,
};

const LABEL_BY_ID = Object.fromEntries(
  AMENITY_OPTIONS.map((a) => [a.id, a.label]),
);

function resolveAmenity(raw: string): {
  id: string;
  label: string;
  Icon: LucideIcon | null;
} {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  const label =
    LABEL_BY_ID[key] ??
    LABEL_BY_ID[raw] ??
    raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const Icon =
    AMENITY_ICON_MAP[key] ??
    AMENITY_ICON_MAP[raw.toLowerCase()] ??
    Object.entries(AMENITY_ICON_MAP).find(
      ([k]) => key.includes(k) || k.includes(key),
    )?.[1] ??
    null;

  return { id: key, label, Icon };
}

function AmenityChip({ raw }: { raw: string }) {
  const { label, Icon } = resolveAmenity(raw);
  return (
    <span className="inline-flex items-center gap-1 text-sm lg:text-[13px] text-[#777b86]">
      {Icon ? (
        <Icon size={20} className="shrink-0 text-[#a3a6af]" />
      ) : (
        <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-[#c4c6ce]" />
      )}
      {label}
    </span>
  );
}

function AmenityIcon({ label }: { label: string }) {
  return <AmenityChip raw={label} />;
}

function useImages(property: PropertyCardData) {
  const fromProp = property.images?.filter(Boolean) ?? [];
  const fromRoom =
    property.roomTypes?.flatMap((r) => r.images ?? []).filter(Boolean) ?? [];
  return [...fromProp, ...fromRoom];
}

function lowestPrice(property: PropertyCardData): number | null {
  if (!property.roomTypes?.length) return null;
  return Math.min(...property.roomTypes.map((r) => Number(r.base_price_ngn)));
}

function SearchCard({
  property,
  isFavorited,
  onOpen,
}: {
  property: PropertyCardData;
  isFavorited: boolean;
  onOpen: () => void;
}) {
  const images = useImages(property);
  const city = property.address?.city ?? property.city ?? "";
  const country = property.address?.country;
  const price = lowestPrice(property);
  const rating = property.rating ?? 4.8;
  const type = property.property_type ?? property.propertyType ?? "Stay";
  const filled = Math.round(Math.min(5, Math.max(0, rating)));

  const rt = property.roomTypes?.[0];
  const amenityPreview = (property.amenities ?? []).slice(0, 3);

  return (
    <article
      onClick={onOpen}
      className="group grid w-full cursor-pointer grid-cols-1 items-center overflow-hidden rounded-2xl border border-[#e8e6e3] bg-white p-4 shadow-sm transition-shadow hover:shadow-md lg:grid-cols-2"
    >
      <div className="relative h-[240px] overflow-hidden rounded-2xl bg-[#ebebeb]">
        {images[0] ? (
          <img
            src={images[0]}
            alt={property.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#a3a6af]">
            <MapPin size={28} />
          </div>
        )}
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          {(property.isSuperhost || property.isGuestFavorite) && (
            <span className="rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-[#17191c] shadow-sm">
              {property.isSuperhost ? "Superhost" : "Guest favorite"}
            </span>
          )}
          {property.instantBook && (
            <span className="rounded-md bg-[#22c55e] px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              Instant Book
            </span>
          )}
        </div>
        <div
          className="absolute right-3 top-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <FavoriteButton
            propertyId={property.id}
            isFavorited={isFavorited}
            className="h-8 w-8 bg-white/95 shadow-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 p-3.5">
        <h3 className="line-clamp-1 text-lg font-semibold text-[#17191c] lg:text-xl">
          {property.name}
        </h3>
        <p className="line-clamp-1 text-sm text-[#777b86] lg:text-base">
          {type.charAt(0).toUpperCase() + type.slice(1)}
          {city ? ` in ${city}` : ""}
          {country ? `, ${country}` : ""}
        </p>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < filled ? "bg-[#22c55e]" : "bg-[#e5e7eb]"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-[#17191c]">
            {rating.toFixed(1)}
            <span className="text-[#a3a6af]">/5</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-0.5">
          {rt?.bedrooms != null && (
            <span className="inline-flex items-center gap-1 text-sm lg:text-base text-[#777b86]">
              <BedDouble size={20} className="text-[#a3a6af]" />
              {rt.bedrooms} Bed
            </span>
          )}
          {rt?.bathrooms != null && (
            <span className="inline-flex items-center gap-1 text-sm lg:text-base text-[#777b86]">
              <Bath size={20} className="text-[#a3a6af]" />
              {rt.bathrooms} Bath
            </span>
          )}
          {amenityPreview.map((a) => (
            <AmenityChip key={a} raw={a} />
          ))}
        </div>

        {price != null && (
          <p className="mt-0.5 text-lg lg:text-2xl font-semibold text-[#17191c]">
            {formatCurrency(price)}
            <span className="text-base font-normal text-[#777b86]"> night</span>
          </p>
        )}
      </div>
    </article>
  );
}

function HomeCard({
  property,
  isFavorited,
  onOpen,
}: {
  property: PropertyCardData;
  isFavorited: boolean;
  onOpen: () => void;
}) {
  const images = useImages(property);
  const city = property.address?.city ?? property.city ?? "";
  const price = lowestPrice(property);
  const rating = property.rating ?? 4.9;

  return (
    <article
      onClick={onOpen}
      className="flex w-full shrink-0 cursor-pointer flex-col gap-2"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#ebebeb]">
        {images[0] ? (
          <img
            src={images[0]}
            alt={property.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#a3a6af]">
            <MapPin size={22} />
          </div>
        )}
        <div
          className="absolute right-2 top-2"
          onClick={(e) => e.stopPropagation()}
        >
          <FavoriteButton
            propertyId={property.id}
            isFavorited={isFavorited}
            className="h-7 w-7 bg-white/90"
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-[14px] font-semibold text-[#222]">
            {city ? `Stay in ${city}` : property.name}
          </p>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-sm">
            <IoStar className="text-[11px]" />
            {rating.toFixed(1)}
          </span>
        </div>
        {price != null && (
          <p className="text-[14px] text-[#222]">
            <span className="font-semibold">{formatCurrency(price)}</span>
            <span className="text-[#717171]"> for 2 nights</span>
          </p>
        )}
      </div>
    </article>
  );
}

function DefaultCard({
  property,
  index,
  isFavorited,
  variant,
  onOpen,
}: {
  property: PropertyCardData;
  index: number;
  isFavorited: boolean;
  variant: "default" | "compact" | "minimal";
  onOpen: () => void;
}) {
  const IMAGE_HEIGHT =
    variant === "default" ? 340 : variant === "compact" ? 220 : 160;
  const showAmenities = variant !== "minimal";
  // const showRating = variant !== "minimal";
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    margin: "0px 100px -120px 0px",
    once: true,
  });

  const city = property.address?.city ?? property.city ?? "";
  const country = property.address?.country;
  const images = useImages(property);
  const primaryImage = images[0] ?? null;
  const secondaryImage = images[1] ?? null;
  const price = lowestPrice(property);
  const visibleAmenities = (property.amenities ?? []).slice(0, 3);

  const TYPE_COLORS: Record<string, string> = {
    shortlet: "bg-[#deddff] text-[#3e3aff]",
    hotel: "bg-[#cdeed3] text-[#347345]",
    guesthouse: "bg-[#f3f3f1] text-[#a37d18]",
  };
  const typeClass =
    TYPE_COLORS[
      property.property_type ?? property.propertyType ?? "shortlet"
    ] ?? "bg-[#f3f3f1] text-[#a37d18]";

  return (
    <motion.div
      ref={ref}
      custom={index}
      variants={smallslideup2}
      initial="initial"
      animate={inView ? "animate" : "exit"}
      onClick={onOpen}
      className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border"
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ height: IMAGE_HEIGHT }}
      >
        {primaryImage ? (
          <motion.div
            initial="initial"
            whileHover="hover"
            className="relative h-full w-full"
          >
            <motion.div
              variants={{
                initial: { opacity: 1 },
                hover: { opacity: secondaryImage ? 0 : 1 },
              }}
              transition={{ delay: 0.025, duration: 0.25, ease: "easeInOut" }}
              className="absolute inset-0 h-full w-full"
            >
              <img
                src={primaryImage}
                alt={property.name}
                className="h-full w-full object-cover"
              />
            </motion.div>
            {secondaryImage && (
              <motion.div
                variants={{ initial: { opacity: 0 }, hover: { opacity: 1 } }}
                transition={{ delay: 0.035, duration: 0.25, ease: "easeInOut" }}
                className="absolute inset-0 h-full w-full"
              >
                <img
                  src={secondaryImage}
                  alt={property.name}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: "var(--color-fog)" }}
          >
            <MapPin size={24} style={{ color: "var(--color-hint-of-grey)" }} />
          </div>
        )}
        <div className="absolute left-3 top-3 z-10">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium capitalize bold ${typeClass}`}
          >
            {property.property_type ?? property.propertyType}
          </span>
        </div>
        <div
          className="absolute right-3 top-3 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <FavoriteButton
            propertyId={property.id}
            isFavorited={isFavorited}
            className="h-8 w-8 bg-white/90 backdrop-blur-sm"
          />
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 px-4 py-8">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="line-clamp-1 flex-1 text-lg lg:text-xl leading-snug bold"
            style={{ color: "var(--color-ink)" }}
          >
            {property.name}
          </h3>
        </div>
        {price !== null && (
          <p
            className="shrink-0 text-lg bold lg:text-2xl"
            style={{ color: "var(--color-ink)" }}
          >
            {formatCurrency(price)}
            <span
              className="text-sm font-normal"
              style={{ color: "var(--color-light-steel)" }}
            >
              /night
            </span>
          </p>
        )}

        <p
          className="flex items-center gap-1 text-sm lg:text-base bold"
          style={{ color: "var(--color-light-steel)" }}
        >
          <MapPin size={20} />
          {city}
          {country ? `, ${country}` : ""}
        </p>
        {/* {showRating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <IoStar key={i} className="text-[14px] text-[#f5a623]" />
              ))}
            </div>
            <span className="text-sm bold" style={{ color: "var(--color-ink)" }}>
              4.7
            </span>
            <span
              className="text-sm"
              style={{ color: "var(--color-light-steel)" }}
            >
              87 reviews
            </span>
          </div>
        )} */}
        {showAmenities && visibleAmenities.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-0.5">
            {visibleAmenities.map((a) => (
              <AmenityIcon key={a} label={a} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function PropertyCard({
  property,
  index = 0,
  isFavorited = false,
  variant = "default",
}: Props) {
  const navigate = useNavigate();
  const onOpen = () => navigate(`/properties/${property.id}`);

  if (variant === "search") {
    return (
      <SearchCard
        property={property}
        isFavorited={isFavorited}
        onOpen={onOpen}
      />
    );
  }
  if (variant === "home") {
    return (
      <HomeCard property={property} isFavorited={isFavorited} onOpen={onOpen} />
    );
  }
  return (
    <DefaultCard
      property={property}
      index={index}
      isFavorited={isFavorited}
      variant={variant as "default" | "compact" | "minimal"}
      onOpen={onOpen}
    />
  );
}
