import { Link }      from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsAuthenticated } from "@/redux/slices/authSlice";

export default function Header() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser     = useSelector(selectCurrentUser);

  return (
    <nav
      className="w-full sticky top-0 z-50"
      style={{ backgroundColor: "var(--color-canvas)", boxShadow: "rgba(0,0,0,0.04) 0px 0px 0px 1px" }}
    >
      <div className="mx-auto px-6 lg:px-8 h-16 flex items-center justify-between" style={{ maxWidth: "1280px" }}>
        <Link to="/" className="text-base tracking-tight font-semibold" style={{ color: "var(--color-ink)" }}>
          Booking
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Properties", "How it works", "About"].map((item) => (
            <Link
              key={item}
              to={`/${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm transition-opacity hover:opacity-60"
              style={{ color: "var(--color-ink)" }}
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && currentUser ? (
            <Link
              to={currentUser.userType.startsWith("host:") ? "/dashboard" : "/trips"}
              className="h-9 px-5 text-sm transition-opacity hover:opacity-80 flex items-center rounded-full"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
            >
              {currentUser.userType.startsWith("host:") ? "Dashboard" : "My Trips"}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="h-9 px-5 text-sm border transition-opacity hover:opacity-70 flex items-center rounded-full"
                style={{ color: "var(--color-ink)", borderColor: "var(--color-ink)" }}
              >
                Log in
              </Link>
              <Link
                to="/onboarding"
                className="h-9 px-5 text-sm transition-opacity hover:opacity-80 flex items-center rounded-full"
                style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}