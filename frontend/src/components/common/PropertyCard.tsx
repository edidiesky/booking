import { useRef }        from "react";
import { useNavigate }   from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { MapPin, Bath, Wifi, BedDouble } from "lucide-react";
import { IoStar }        from "react-icons/io5";
import { formatCurrency } from "@/utils/formatCurrency";
import FavoriteButton from "./FavoriteButton";
// import FavoriteButton     from "./FavoriteButton";

// Deliberately narrower than the full Property type: this card is used
// against both the full search-listing response (nested address, full
// roomTypes) and the public seller-profile response (flat city, no
// country at all, curated roomTypes). Requiring the full Property type
// here would force the narrower, intentionally-curated public-profile
// shape to either over-fetch fields it doesn't need or get unsafely cast.
// Any object satisfying this structural subset works, the full Property
// type already does, since a superset always satisfies a subset.
interface PropertyCardData {
  id:            string;
  name:          string;
  images?:       string[];
  amenities?:    string[];
  property_type?: string;
  propertyType?:  string;
  address?:      { city: string; country: string };
  city?:         string; // flat alternative, used by the public-profile shape which has no address object and no country at all
  roomTypes?:    { images?: string[]; base_price_ngn: number | string }[];
}

interface Props {
  property:    PropertyCardData;
  index?:      number;
  isFavorited?: boolean;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi:       <Wifi      size={13} />,
  "wi-fi":    <Wifi      size={13} />,
  bathroom:   <Bath      size={13} />,
  bath:       <Bath      size={13} />,
  bedroom:    <BedDouble size={13} />,
  bed:        <BedDouble size={13} />,
};

function AmenityIcon({ label }: { label: string }) {
  const key  = label.toLowerCase();
  const icon = Object.entries(AMENITY_ICONS).find(([k]) => key.includes(k))?.[1];
  return (
    <span className="flex items-center gap-1 text-sm" style={{ color: "var(--color-light-steel)" }}>
      {icon ?? <span className="w-1 h-1 rounded-full bg-current inline-block" />}
      {label}
    </span>
  );
}

export default function PropertyCard({ property, index = 0, isFavorited = false }: Props) {
  const navigate = useNavigate();
  const ref      = useRef<HTMLDivElement>(null);
  const inView   = useInView(ref, { margin: "0px 100px -120px 0px", once: true });

  const city    = property.address?.city ?? property.city ?? "";
  const country = property.address?.country;

  const primaryImage   = property.images?.[0]
    ?? property.roomTypes?.[0]?.images?.[0]
    ?? null;

  const secondaryImage = property.images?.[1]
    ?? property.roomTypes?.[0]?.images?.[1]
    ?? null;

  const lowestPrice = property.roomTypes?.length
    ? Math.min(...property.roomTypes.map((r) => Number(r.base_price_ngn)))
    : null;

  const visibleAmenities = (property.amenities ?? []).slice(0, 3);

  const TYPE_COLORS: Record<string, string> = {
    shortlet:   "bg-[#deddff] text-[#3e3aff]",
    hotel:      "bg-[#cdeed3] text-[#347345]",
    guesthouse: "bg-[#f3f3f1] text-[#a37d18]",
  };

  const typeClass = TYPE_COLORS[property.property_type ?? property.propertyType ?? "shortlet"]
    ?? "bg-[#f3f3f1] text-[#a37d18]";

  return (
    <motion.div
      ref={ref}
      custom={index}
      variants={{
        initial: { opacity: 0, y: "70px" },
        animate: (i: number) => ({
          opacity: 1,
          y: "0%",
          transition: { duration: 0.5, delay: i * 0.01 },
        }),
        exit: { opacity: 0, y: "70px" },
      }}
      initial="initial"
      animate={inView ? "animate" : "exit"}
      onClick={() => navigate(`/properties/${property.id}`)}
      className="w-full flex flex-col overflow-hidden cursor-pointer group"
    >
      {/* image area */}
      <div className="w-full h-[340px] rounded-xl  overflow-hidden relative">

        {primaryImage ? (
          <motion.div
            initial="initial"
            whileHover="hover"
            className="w-full h-full relative"
          >
            {/* primary image */}
            <motion.div
              variants={{
                initial: { opacity: 1 },
                hover:   { opacity: secondaryImage ? 0 : 1 },
              }}
              transition={{ delay: 0.025, duration: 0.25, ease: "easeInOut" }}
              className="w-full h-full absolute inset-0"
            >
              <img
                src={primaryImage}
                alt={property.name}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* secondary image crossfade */}
            {secondaryImage && (
              <motion.div
                variants={{
                  initial: { opacity: 0 },
                  hover:   { opacity: 1 },
                }}
                transition={{ delay: 0.035, duration: 0.25, ease: "easeInOut" }}
                className="w-full h-full absolute inset-0"
              >
                <img
                  src={secondaryImage}
                  alt={property.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: "var(--color-fog)" }}
          >
            <MapPin size={24} style={{ color: "var(--color-hint-of-grey)" }} />
          </div>
        )}

        {/* property type badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`text-sm bold px-3 py-1 rounded-full capitalize font-medium ${typeClass}`}>
            {property.property_type ?? property.propertyType}
          </span>
        </div>

        {/* favorite */}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton
            propertyId={property.id}
            isFavorited={isFavorited}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* card body */}
      <div className="w-full flex flex-col py-4 gap-1">

        {/* name + price */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-lg bold leading-snug line-clamp-1 flex-1"
            style={{ color: "var(--color-ink)" }}
          >
            {property.name}
          </h3>
          {lowestPrice !== null && (
            <p className="text-sm lg:text-base bold shrink-0" style={{ color: "var(--color-ink)" }}>
              {formatCurrency(lowestPrice)}
              <span className="text-sm font-normal" style={{ color: "var(--color-light-steel)" }}>
                /night
              </span>
            </p>
          )}
        </div>

        {/* location */}
        <p className="text-sm bold flex items-center gap-1" style={{ color: "var(--color-light-steel)" }}>
          {city}{country ? `, ${country}` : ""}
        </p>

        {/* star rating placeholder */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <IoStar key={i} className="text-[13px] text-[#f5a623]" />
            ))}
          </div>
          <span className="text-sm bold" style={{ color: "var(--color-ink)" }}>4.7</span>
          <span className="text-sm" style={{ color: "var(--color-light-steel)" }}>87 reviews</span>
        </div>

        {/* amenities */}
        {visibleAmenities.length > 0 && (
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