import { motion }          from "framer-motion";
import { Shield, Zap, HeartHandshake } from "lucide-react";

const FEATURES = [
  {
    Icon:        Shield,
    title:       "Secure payments",
    description: "All payments are held in escrow and released only after check-out. Your money is always protected.",
  },
  {
    Icon:        Zap,
    title:       "Instant booking",
    description: "Reserve a property in minutes. No back-and-forth. Availability is updated in real time.",
  },
  {
    Icon:        HeartHandshake,
    title:       "Verified hosts",
    description: "Every host goes through identity verification. What you see is exactly what you get.",
  },
];

export default function Features() {
  return (
    <section className="w-full py-20" style={{ backgroundColor: "var(--color-fog)" }}>
      <div className="mx-auto px-6 lg:px-8" style={{ maxWidth: "1280px" }}>
        <div className="flex flex-col gap-3 mb-14">
          <p className="text-xs lg:text-sm uppercase bold"
             style={{ color: "var(--color-hint-of-grey)" }}>
            Why Booking Platform
          </p>
          <h2 className="text-3xl lg:text-4xl bold"
              style={{ color: "var(--color-ink)", letterSpacing: "-0.3px" }}>
            Everything you need for a great stay.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex flex-col gap-4 p-8 rounded-2xl border"
              style={{ backgroundColor: "var(--color-canvas)", borderColor: "#e8e6e3" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ backgroundColor: "var(--color-warm-mist)" }}>
                <Icon size={18} style={{ color: "var(--color-terracotta)" }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xs lg:text-sm" style={{ color: "var(--color-ink)" }}>
                  {title}
                </h3>
                <p className="text-xs lg:text-smleading-relaxed" style={{ color: "var(--color-light-steel)" }}>
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}