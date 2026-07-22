import { Link } from "react-router-dom";

const LINKS = {
  Product:  ["Properties", "How it works", "Pricing"],
  Guests:   ["Find a stay", "My Trips", "Support"],
  Hosts:    ["List your property", "Host dashboard", "Resources"],
  Company:  ["About", "Privacy", "Terms"],
};

export default function Footer() {
  return (
    <footer
      className="w-full border-t mt-auto"
      style={{ backgroundColor: "var(--color-fog)", borderColor: "#e8e6e3" }}
    >
      <div className="mx-auto px-6 lg:px-8 py-12" style={{ maxWidth: "1280px" }}>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-3">
            <span className="text-lg lg:text-xl bold" style={{ color: "var(--color-ink)" }}>
              Booking
            </span>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-light-steel)" }}>
              Find and book extraordinary stays with ease.
            </p>
          </div>

          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group} className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-widest bold"
                 style={{ color: "var(--color-hint-of-grey)" }}>
                {group}
              </p>
              {items.map((item) => (
                <Link
                  key={item}
                  to="/"
                  className="text-xs transition-opacity hover:opacity-60"
                  style={{ color: "var(--color-muted-stone)" }}
                >
                  {item}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="border-t mt-10 pt-6 flex items-center justify-between" style={{ borderColor: "#e8e6e3" }}>
          <p className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>
            © {new Date().getFullYear()} Booking Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}