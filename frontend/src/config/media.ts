/**
 * Hero media. One place to swap assets.
 *
 * WARNING: video and poster are vivre.agency's hosted files (carried over
 * from the previous hero). They are not licensed for reuse. Replace with
 * owned or licensed footage before production. Self-host them too: a
 * third-party host can change, rate-limit or remove the file at any time.
 */
export const HERO_MEDIA = {
  video: "https://vivre.agency/wp-content/uploads/2026/01/intro-vivre-small.mp4",
  poster: "https://vivre.agency/wp-content/uploads/2026/01/hero-poster-home.avif",
  /** Mobile and reduced-motion image. Lives in /public. */
  fallback: "/hero.jpg",
} as const;
