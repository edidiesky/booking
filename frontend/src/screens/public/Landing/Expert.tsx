import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, ShieldCheck, Bell, Wallet } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimateTextWord from "@/components/common/AnimateTextWord";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    tag: "AVAILABILITY CALENDAR",
    title: "One calendar, every property, no double bookings.",
    bullets: [
      "Live availability computed at the moment of checkout, not a cached count",
      "Automatic 3-hour turnover buffer between guests",
      "Gantt and month views, both real-time",
    ],
    icon: CalendarCheck,
    accentColor: "var(--color-terracotta)",
    tagBg: "var(--color-warm-mist)",
    image: "/images/hero/feature1.jpg",
  },
  {
    tag: "ESCROW",
    title: "Guest pays, funds hold, host gets paid at checkout.",
    bullets: [
      "Every booking's payment held in escrow until the stay completes",
      "Automatic payout release, no manual reconciliation",
      "Full refund handling built in, not bolted on",
    ],
    icon: Wallet,
    accentColor: "var(--color-ink)",
    tagBg: "var(--color-fog)",
    image: "/images/hero/feature2.jpg",
  },
  {
    tag: "TEAM & ROLES",
    title: "Invite staff with exactly the access they need.",
    bullets: [
      "Custom roles per tenant, not just admin/staff",
      "Invitation by email code, no shared logins",
      "Full activity log of who did what, and when",
    ],
    icon: ShieldCheck,
    accentColor: "var(--color-terracotta)",
    tagBg: "var(--color-warm-mist)",
    image: "/images/hero/feature3.jpg",
  },
  {
    tag: "NOTIFICATIONS",
    title: "Know the moment a guest checks in, not an hour later.",
    bullets: [
      "Real-time bell notifications on booking, check-in, check-out",
      "Email and SMS for guests, in-app for your team",
      "Campaign tools for reaching past guests directly",
    ],
    icon: Bell,
    accentColor: "var(--color-ink)",
    tagBg: "var(--color-fog)",
    image: "/images/hero/feature4.jpg",
  },
];

export default function Expert() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
    const ctx = gsap.context(() => {
      // Pin each card
      cards.forEach((card, index) => {
        if (index < cards.length - 1) {
          ScrollTrigger.create({
            trigger: card,
            start: "top 10%",
            endTrigger: cards[cards.length - 1],
            end: "top top",
            pin: true,
            pinSpacing: false,
          });
        }
      });

      cards.forEach((card, index) => {
        if (index < cards.length - 1) {
          const overlay = card.querySelector(".card-overlay") as HTMLElement;

          ScrollTrigger.create({
            trigger: cards[index + 1],
            start: "top bottom",
            end: "top top",
            onUpdate: (self) => {
              const progress = self.progress;
              const scale = 1 - progress * 0.2;
              const rotation = (index % 2 === 0 ? 1 : -1) * progress;

              gsap.set(card, {
                scale,
                rotation,
                transformOrigin: "center 20%",
                border: "1px solid rgba(0,0,0,0.1)",
              });
              if (overlay) gsap.set(overlay, { opacity: progress * 0.55 });
            },
            onLeave: () => {
              const progress = 1;
              const scale = 1 - progress * 0.2;
              const rotation = (index % 2 === 0 ? 2 : -2) * progress;
              gsap.set(card, {
                scale,
                rotation,
                border: "1px solid rgba(0,0,0,0.1)",
              });
              if (overlay) gsap.set(overlay, { opacity: 0.55 });
            },
            onEnterBack: () => {
              gsap.set(card, { scale: 1, rotation: 0 });
              if (overlay) gsap.set(overlay, { opacity: 0 });
            },
          });
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      style={{ backgroundColor: "var(--color-canvas)" }}
    >
      <div
        className="mx-auto px-6 lg:px-8 pt-32 pb-20 text-center"
        style={{ maxWidth: "1280px" }}
      >
        <span
          className="text-base lg:text-xl uppercase"
          style={{ color: "var(--color-light-steel)" }}
        >
          Everything you need
        </span>
        <h2
          className="text-4xl lg:text-6xl mt-2 max-w-2xl mx-auto text-center "
          style={{ color: "var(--color-ink)", letterSpacing: "-0.66px" }}
        >
          <AnimateTextWord type="bigtext_Center">
            One platform. Every tool your booking business needs.
          </AnimateTextWord>
        </h2>
      </div>

      {features.map((feature, i) => {
        return (
          <div
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="sticky-card max-w-[90rem] mx-auto sticky flex items-center px-6 lg:px-8 py-16 will-change-transform"
            style={{
              top: "0px",
              zIndex: i + 1,
              backgroundColor: "var(--color-canvas)",
              position: "sticky",
            }}
          >
            <div
              className="card-overlay absolute inset-0 pointer-events-none"
              style={{
                backgroundColor: "rgba(0,0,0,1)",
                opacity: 0,
                zIndex: 10,
              }}
            />

            <div
              className="mx-auto w-full grid lg:grid-cols-2 gap-16 items-center"
              style={{ maxWidth: "1280px" }}
            >
              {/* left: text */}
              <div className="flex flex-col gap-6">
                <span
                  className="text-base  px-3 py-1.5 rounded-full w-fit"
                  style={{
                    color: feature.accentColor,
                    backgroundColor: feature.tagBg,
                  }}
                >
                  {feature.tag}
                </span>

                <h3
                  className="text-3xl lg:text-5xl  leading-[1.4]"
                  style={{
                    color: "var(--color-ink)",
                    letterSpacing: "-0.66px",
                  }}
                >
                  <AnimateTextWord type="bigtext_Center">
                    {feature.title}
                  </AnimateTextWord>
                  
                </h3>

                <ul className="flex flex-col gap-3">
                  {feature.bullets.map((bullet, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-3 text-lg leading-relaxed"
                      style={{
                        color: "var(--color-muted-stone)",
                        letterSpacing: "-0.009em",
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                        style={{ backgroundColor: feature.accentColor }}
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              {/* right: image */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                viewport={{ once: true, margin: "-80px" }}
                className="w-full h-[520px] rounded-[24px] overflow-hidden"
                style={{ boxShadow: "var(--shadow-steep)" }}
              >
                <img
                  src={feature.image}
                  alt={feature.tag}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        );
      })}

      {/* spacer so last card scrolls off naturally */}
      <div style={{ height: "30vh" }} />
    </section>
  );
}
