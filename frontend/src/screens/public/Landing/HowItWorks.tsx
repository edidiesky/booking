import { motion } from "framer-motion";

const STEPS = [
  { num: "01", title: "Browse properties",   body: "Search by city, dates, and property type. Filter by amenities and price." },
  { num: "02", title: "Book and pay",        body: "Select your dates, confirm your booking, and pay securely via Paystack or Flutterwave." },
  { num: "03", title: "Check in and enjoy",  body: "Receive your booking confirmation, check in on arrival, and check out when done." },
];

export default function HowItWorks() {
  return (
    <section className="w-full py-20" style={{ backgroundColor: "var(--color-canvas)" }}>
      <div className="mx-auto px-6 lg:px-8" style={{ maxWidth: "1280px" }}>
        <div className="flex flex-col gap-3 mb-14">
          <p className="text-xs lg:text-smuppercase bold"
             style={{ color: "var(--color-hint-of-grey)" }}>
            How it works
          </p>
          <h2 className="text-3xl lg:text-4xl bold"
              style={{ color: "var(--color-ink)", letterSpacing: "-0.3px" }}>
            Book a stay in three steps.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {STEPS.map(({ num, title, body }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="flex flex-col gap-4 p-8 border-b lg:border-b-0 lg:border-r last:border-r-0 last:border-b-0"
              style={{ borderColor: "#e8e6e3" }}
            >
              <span className="text-4xl bold"
                    style={{ color: "var(--color-warm-mist)", fontFamily: "'Georgia', serif" }}>
                {num}
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xs lg:text-sm" style={{ color: "var(--color-ink)" }}>
                  {title}
                </h3>
                <p className="text-xs lg:text-smleading-relaxed" style={{ color: "var(--color-light-steel)" }}>
                  {body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}