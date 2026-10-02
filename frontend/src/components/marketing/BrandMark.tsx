import { BRAND } from "@/config/brand";

/**
 * Key-tag mark: a rounded tag with a punched hole. The same shape carries the
 * booking record on Home, so the logo and the product story share one object.
 */
export default function BrandMark({
  inverse = false,
  size = "md",
}: {
  inverse?: boolean;
  size?: "md" | "lg";
}) {
  const lg = size === "lg";
  const fill = inverse ? "#ffffff" : "var(--mk-lagoon)";
  const hole = inverse ? "var(--mk-lagoon-deep)" : "var(--mk-paper)";
  return (
    <span className={`inline-flex items-center ${lg ? "gap-2.5" : "gap-2"}`}>
      <svg width={lg ? 30 : 22} height={lg ? 35 : 26} viewBox="0 0 22 26" aria-hidden="true">
        <path
          d="M3 7.5 11 1l8 6.5V22a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7.5Z"
          fill={fill}
        />
        <circle cx="11" cy="8" r="2.4" fill={hole} />
        <rect x="7" y="15" width="8" height="1.6" rx="0.8" fill={hole} opacity="0.55" />
        <rect x="7" y="18.6" width="5" height="1.6" rx="0.8" fill={hole} opacity="0.55" />
      </svg>
      <span
        className={`${lg ? "text-2xl" : "text-xl"} font-[680] tracking-[-0.03em]`}
        style={{ color: inverse ? "#fff" : "var(--mk-ink)" }}
      >
        {BRAND.name.toLowerCase()}
      </span>
    </span>
  );
}
