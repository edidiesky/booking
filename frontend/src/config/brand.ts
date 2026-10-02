/**
 * Single source of truth for brand identity on public pages.
 * "Bukkings" is a placeholder. Rename here; nothing else hardcodes the name.
 */
export const BRAND = {
  name: "Bukkings",
  legalName: "Bukkings Technologies Limited",
  tagline: "Shortlets you can book without the guesswork.",
  supportEmail: "hello@keyhold.ng",
  hostsEmail: "hosts@keyhold.ng",
  /** Cities shown in the footer strip. `live: true` renders as active. */
  cities: [
    { name: "Lagos", live: true },
    { name: "Abuja", live: true },
    { name: "Port Harcourt", live: false },
    { name: "Ibadan", live: false },
    { name: "Enugu", live: false },
    { name: "Kano", live: false },
    { name: "Benin City", live: false },
    { name: "Uyo", live: false },
  ],
  appLinks: {
    ios: "#",
    android: "#",
  },
} as const;

export type NavItem = {
  label: string;
  to: string;
  blurb: string;
  detail: string;
};

/** Primary marketing navigation. Also drives the Explore index on Home. */
export const NAV: NavItem[] = [
  {
    label: "Stays",
    to: "/stays",
    blurb: "What you can book",
    detail:
      "Shortlets, hotels and guesthouses, and what every listing has to show before it goes live.",
  },
  {
    label: "For hosts",
    to: "/hosts",
    blurb: "Run your listings",
    detail:
      "Your own booking page, one calendar for every unit, a team with roles, and payouts you can trace.",
  },
  {
    label: "Trust",
    to: "/trust",
    blurb: "Who you are booking from",
    detail:
      "How hosts are verified, how reviews are earned, and what happens when a stay goes wrong.",
  },
  {
    label: "How it works",
    to: "/how-it-works",
    blurb: "The money and the record",
    detail:
      "Where your payment waits, when the host is paid, and the record every booking leaves behind.",
  },
  {
    label: "About",
    to: "/about",
    blurb: "Who we are",
    detail:
      "Why we built a marketplace around held payments and verified hosts, and what we stand on.",
  },
];

/** Header pill: Home first, then the pages, Contact last (as on the reference). */
export const HEADER_NAV: { label: string; to: string }[] = [
  { label: "Home", to: "/" },
  ...NAV.map(({ label, to }) => ({ label, to })),
  { label: "Contact", to: "/contact" },
];
