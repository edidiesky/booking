import "@/design/tokens.css";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { BRAND } from "@/config/brand";
import { EASE_OUT } from "@/design/motion";
import BrandMark from "./BrandMark";

const COLUMNS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Guests",
    links: [
      { label: "Find a stay", to: "/search" },
      { label: "Shortlets", to: "/search?propertyType=shortlet" },
      { label: "Hotels", to: "/search?propertyType=hotel" },
      { label: "Guesthouses", to: "/search?propertyType=guesthouse" },
      { label: "Saved stays", to: "/favorites" },
    ],
  },
  {
    title: "Hosts",
    links: [
      { label: "Why host with us", to: "/hosts" },
      { label: "List your property", to: "/onboarding" },
      { label: "Your booking page", to: "/hosts#storefront" },
      { label: "Payouts", to: "/how-it-works#escrow" },
      { label: "Host sign in", to: "/login" },
    ],
  },
  {
    title: "Trust",
    links: [
      { label: "Host verification", to: "/trust#verification" },
      { label: "Reviews", to: "/trust#reviews" },
      { label: "Cancellations", to: "/trust#cancellations" },
      { label: "The booking record", to: "/how-it-works#record" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "How it works", to: "/how-it-works" },
      { label: "Stays", to: "/stays" },
      { label: "Contact", to: "/contact" },
    ],
  },
];

export default function SiteFooter() {
  const reduce = useReducedMotion();
  const year = new Date().getFullYear();

  return (
    <footer className="mkt overflow-hidden bg-[var(--mk-lagoon-deep)] text-white">
      {/* Cities */}
      <div className="mk-container border-b border-white/10 py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-end">
          <div>
            <p className="text-[1.0625rem] font-[600]">Where you can book</p>
            <p className="mt-1.5 max-w-[34ch] text-[0.9375rem] leading-relaxed text-white/60">
              Verified hosts in the cities below. New cities open when their hosts are verified, not
              before.
            </p>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Cities">
            {BRAND.cities.map((c) => (
              <li
                key={c.name}
                className={`inline-flex items-center gap-2 text-[1.25rem] font-[600] tracking-[-0.02em] ${
                  c.live ? "text-white" : "text-white/35"
                }`}
              >
                {c.live && (
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#7fd8a9]" />
                )}
                {c.name}
                <span className="sr-only">{c.live ? "(live)" : "(coming later)"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Columns */}
      <div className="mk-container grid gap-12 py-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,3fr)]">
        <div className="flex flex-col gap-5">
          <BrandMark inverse />
          <p className="max-w-[32ch] text-[1rem] leading-relaxed text-white/70">
            Verified hosts, payments held until you check in, and a record of every booking.
          </p>
          <a href={`mailto:${BRAND.supportEmail}`} className="mk-link w-fit text-white">
            {BRAND.supportEmail}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-[0.875rem] font-[600] text-white/50">{col.title}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-[0.9375rem] text-white/85 transition-colors duration-150 hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Legal */}
      <div className="mk-container flex flex-col gap-3 border-t border-white/10 py-6 text-[0.875rem] text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {BRAND.legalName}
        </p>
        <div className="flex gap-5">
          <Link to="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-white">
            Terms
          </Link>
        </div>
      </div>

      {/* Wordmark: one reveal on entering view, then static. No marquee. */}
      <div aria-hidden="true" className="mk-container select-none pb-2">
        <motion.p
          className="whitespace-nowrap text-center font-[720] leading-[0.8] tracking-[-0.06em] text-white/[0.07]"
          style={{ fontSize: "clamp(5rem, 22vw, 20rem)" }}
          initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
          whileInView={{ clipPath: "inset(0% 0 0 0)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE_OUT }}
        >
          {BRAND.name.toLowerCase()}
        </motion.p>
      </div>
    </footer>
  );
}
