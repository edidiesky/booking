import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight } from "lucide-react";
import { selectCurrentUser, selectIsAuthenticated } from "@/redux/slices/authSlice";
import HeaderAccount from "../HeaderAccount";

/**
 * Right side: an outlined secondary and a near-black primary with an arrow,
 * as on the reference. The outlined slot is "Sign in" rather than "Contact":
 * on a live booking product, signing in matters more (Contact is in the pill).
 */
export default function HeaderActions() {
  const { pathname } = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const isHost = user?.userType?.startsWith("host:") ?? false;

  return (
    <div className="flex items-center gap-2.5">
      {isAuthenticated && user ? (
        <HeaderAccount isHost={isHost} />
      ) : (
        <Link
          to="/login"
          state={{ from: pathname }}
          className="hidden h-12 items-center rounded-full border border-[var(--mk-line)] bg-[var(--mk-surface)] px-6 text-[1rem] font-[520] text-[var(--mk-ink)] transition-[border-color,background-color] duration-150 ease-out hover:border-[var(--mk-faint)] active:scale-[0.96] md:inline-flex"
        >
          Sign in
        </Link>
      )}
      <Link
        to="/search"
        className="group/cta hidden h-12 items-center gap-2 rounded-full bg-[var(--mk-ink)] pe-5 ps-6 text-[1rem] font-[560] text-white transition-[background-color,scale] duration-150 ease-out hover:bg-black active:scale-[0.96] sm:inline-flex"
      >
        Find a stay
        <ArrowRight
          size={18}
          strokeWidth={2}
          aria-hidden="true"
          className="transition-transform duration-150 ease-out group-hover/cta:translate-x-0.5"
        />
      </Link>
    </div>
  );
}
