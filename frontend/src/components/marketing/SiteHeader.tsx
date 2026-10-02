import "@/design/tokens.css";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "@/redux/slices/authSlice";
import { BRAND } from "@/config/brand";
import { useScrolled } from "@/hooks/useScrolled";
import BrandMark from "./BrandMark";
import NavPill from "./header/NavPill";
import HeaderActions from "./header/HeaderActions";
import MenuToggle from "./header/MenuToggle";
import MobileMenu from "./header/MobileMenu";

/**
 * Layout matches the reference: logo left, grey nav pill centred,
 * outlined + solid actions right, on a white bar. A hairline appears once
 * the page scrolls, so the bar separates from content without a heavy edge.
 */
export default function SiteHeader() {
  const scrolled = useScrolled(8);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => setOpen(false), [pathname]);
  const close = useCallback(() => setOpen(false), []);

  return (
    <header
      className="mkt sticky top-0 z-50 bg-[var(--mk-surface)]"
      style={{
        boxShadow: scrolled || open ? "0 1px 0 var(--mk-line)" : "0 1px 0 transparent",
        transition: "box-shadow 150ms ease-out",
      }}
    >
      {/* Horizontal inset equals the hero card edge plus its copy padding, so
          the logo sits on the same line as the headline. */}
      <div className="grid h-[5.5rem] w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-8 sm:px-14 lg:px-[4.5rem]">
        <Link to="/" aria-label={`${BRAND.name} home`} className="w-fit rounded-md">
          <BrandMark size="lg" />
        </Link>
        <NavPill />
        <div className="flex items-center justify-end gap-2.5">
          <HeaderActions />
          <MenuToggle open={open} onToggle={() => setOpen((v) => !v)} />
        </div>
      </div>
      <MobileMenu open={open} onClose={close} isAuthenticated={isAuthenticated} />
    </header>
  );
}
