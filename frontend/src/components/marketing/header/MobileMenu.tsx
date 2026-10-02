import { useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BRAND, HEADER_NAV } from "@/config/brand";
import { DURATION, EASE_DRAWER } from "@/design/motion";
import { useMenuA11y } from "./useMenuA11y";

interface Props {
  open: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}

/** Full-screen menu below the header bar (5.5rem), for widths under xl. */
export default function MobileMenu({ open, onClose, isAuthenticated }: Props) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  useMenuA11y(open, panelRef, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-x-0 bottom-0 top-[5.5rem] z-40 flex flex-col overflow-y-auto bg-[var(--mk-surface)] xl:hidden"
          initial={reduce ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: DURATION.drawer, ease: EASE_DRAWER }}
        >
          <nav aria-label="Mobile" className="mk-container flex-1 pt-4">
            <ul className="flex flex-col">
              {HEADER_NAV.map((l, i) => (
                <motion.li
                  key={l.to}
                  initial={reduce ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: EASE_DRAWER, delay: 0.04 * i }}
                  className="border-b border-[var(--mk-line)]"
                >
                  <NavLink
                    to={l.to}
                    end={l.to === "/"}
                    className={({ isActive }) =>
                      `flex h-16 items-center text-[1.75rem] font-[620] tracking-[-0.025em] ${
                        isActive ? "text-[var(--mk-lagoon)]" : "text-[var(--mk-ink)]"
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                </motion.li>
              ))}
            </ul>
          </nav>
          <div className="mk-container flex flex-col gap-3 pb-8 pt-8">
            <Link to="/search" className="mk-btn w-full bg-[var(--mk-ink)] text-white">
              Find a stay
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className="mk-btn mk-btn-ghost w-full">
                Sign in
              </Link>
            )}
            <a href={`mailto:${BRAND.supportEmail}`} className="mt-3 text-center text-[0.9375rem] text-[var(--mk-muted)]">
              {BRAND.supportEmail}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
