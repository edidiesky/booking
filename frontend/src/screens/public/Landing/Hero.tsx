import { useNavigate }    from "react-router-dom";
import { useSelector }    from "react-redux";
import { motion }         from "framer-motion";
import { ArrowRight, MapPin, Calendar, Search } from "lucide-react";
import { selectCurrentUser, selectIsAuthenticated } from "@/redux/slices/authSlice";

export default function Hero() {
  const navigate        = useNavigate();
  const currentUser     = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const handleCta = () => {
    if (!isAuthenticated)                        { navigate("/select-user-type"); return; }
    if (currentUser?.userType.startsWith("host:")) { navigate("/dashboard");       return; }
    navigate("/properties");
  };

  return (
    <section className="w-full overflow-hidden" style={{ backgroundColor: "var(--color-canvas)" }}>
      <div className="mx-auto px-6 lg:px-8 pt-20 pb-16" style={{ maxWidth: "1280px" }}>
        <div className="flex flex-col gap-8 items-center justify-center">

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm"
            style={{ borderColor: "#e8e6e3", color: "var(--color-muted-stone)" }}
          >
            <MapPin size={13} />
            Properties across Nigeria
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center leading-[1.05]"
            style={{
              fontSize:      "clamp(48px, 8vw, 80px)",
              color:         "var(--color-ink)",
              letterSpacing: "-0.025em",
              fontFamily:    "'Georgia', serif",
            }}
          >
            Find your next
            <br />
            perfect stay.
            <br />
            <span style={{ color: "var(--color-terracotta)" }}>
              Book with ease.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base lg:text-xl text-center leading-relaxed max-w-md"
            style={{ color: "var(--color-muted-stone)" }}
          >
            Browse shortlets, hotels, and guesthouses. Pay securely,
            check in smoothly, and check out stress-free.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-3 flex-wrap justify-center"
          >
            <button
              onClick={handleCta}
              className="h-14 px-7 text-base flex items-center gap-2 transition-opacity hover:opacity-80 rounded-full"
              style={{ backgroundColor: "var(--color-ink)", color: "var(--color-canvas)" }}
            >
              {isAuthenticated ? "Browse Properties" : "Get started"}
              <ArrowRight size={14} />
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => navigate("/login")}
                className="h-14 px-7 text-base border transition-opacity hover:opacity-70 rounded-full"
                style={{ color: "var(--color-ink)", borderColor: "var(--color-ink)" }}
              >
                Log in
              </button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-4 pt-2"
          >
            {[
              { icon: Search,   label: "Browse properties"  },
              { icon: Calendar, label: "Book instantly"      },
              { icon: MapPin,   label: "Across Nigeria"      },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-sm"
                   style={{ color: "var(--color-muted-stone)" }}>
                <Icon size={14} />
                {label}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}