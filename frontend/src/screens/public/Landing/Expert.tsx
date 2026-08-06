import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, ShieldCheck, Bell, Wallet } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimateTextWord from "@/components/common/AnimateTextWord";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

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

const N = features.length;

export default function Expert() {
  const sectionRef = useRef(null);
  const pinRef = useRef(null); // the single element that gets pinned
  const cardRefs = useRef([]);

  useEffect(() => {
    const cards = cardRefs.current.filter(Boolean);
    const ctx = gsap.context(() => {
      // One ScrollTrigger drives the whole stack. Scrub ties progress
      // directly to scroll position, so there's nothing to "catch up"
      // on fast or reversed scroll — no separate pin/unpin per card.
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: () => `+=${(N - 1) * window.innerHeight}`,
        pin: pinRef.current,
        pinSpacing: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const raw = self.progress * (N - 1); // 0 .. N-1

          cards.forEach((card, i) => {
            const inner = card.querySelector(".card-inner");
            const overlay = card.querySelector(".card-overlay");
            if (!inner) return;

            // How "behind" this card currently is (0 = fully active/top,
            // 1 = fully covered by the next card, negative = not yet reached)
            const behind = gsap.utils.clamp(0, 1, raw - i);

            const scale = 1 - behind * 0.2;
            const rotation = (i % 2 === 0 ? 1 : -1) * behind * 2;
            const y = -behind * 24; // slight lift as it recedes

            gsap.set(inner, {
              scale,
              rotation,
              y,
              force3D: true,
            });
            if (overlay) gsap.set(overlay, { opacity: behind * 0.55 });

            // Keep the not-yet-active cards visually stacked underneath
            card.style.zIndex = String(i + 1);
          });
        },
      });

      return () => st.kill();
    }, sectionRef);

    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) document.fonts.ready.then(refresh);

    const imgs = sectionRef.current?.querySelectorAll("img") ?? [];
    Promise.all(
      Array.from(imgs).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((res) => {
              img.addEventListener("load", res, { once: true });
              img.addEventListener("error", res, { once: true });
            }),
      ),
    ).then(refresh);

    window.addEventListener("load", refresh);
    return () => {
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} style={{ backgroundColor: "var(--color-canvas)" }}>
      <div className="mx-auto px-6 lg:px-8 pt-32 pb-20 text-center" style={{ maxWidth: "1280px" }}>
        <span className="text-base lg:text-xl uppercase" style={{ color: "var(--color-light-steel)" }}>
          Everything you need
        </span>
        <h2 className="text-4xl lg:text-6xl mt-2 max-w-2xl mx-auto text-center" style={{ color: "var(--color-ink)", letterSpacing: "-0.66px" }}>
          <AnimateTextWord type="bigtext_Center">
            One platform. Every tool your booking business needs.
          </AnimateTextWord>
        </h2>
      </div>

      {/* single pinned viewport-height container holding all cards absolutely stacked */}
      <div ref={pinRef} className="relative w-full h-screen overflow-hidden">
        {features.map((feature, i) => (
          <div
            key={i}
            ref={(el) => { cardRefs.current[i] = el; }}
            className="absolute inset-0 flex items-center px-6 lg:px-8 will-change-transform"
            style={{ zIndex: i + 1, backgroundColor: "var(--color-canvas)" }}
          >
            <div
              className="card-inner relative w-full will-change-transform overflow-hidden rounded-[24px]"
              style={{ transformOrigin: "center 20%" }}
            >
              <div className="mx-auto w-full grid lg:grid-cols-2 gap-16 items-center" style={{ maxWidth: "1280px" }}>
                <div className="flex flex-col gap-6">
                  <span
                    className="text-base px-3 py-1.5 rounded-full w-fit"
                    style={{ color: feature.accentColor, backgroundColor: feature.tagBg }}
                  >
                    {feature.tag}
                  </span>
                  <h3
                    className="text-3xl lg:text-5xl leading-[1.4]"
                    style={{ color: "var(--color-ink)", letterSpacing: "-0.66px" }}
                  >
                    <AnimateTextWord type="bigtext_Center">{feature.title}</AnimateTextWord>
                  </h3>
                  <ul className="flex flex-col gap-3">
                    {feature.bullets.map((bullet, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-3 text-lg leading-relaxed"
                        style={{ color: "var(--color-muted-stone)", letterSpacing: "-0.009em" }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: feature.accentColor }} />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  viewport={{ once: true, margin: "-80px" }}
                  className="w-full h-[520px] rounded-[24px] overflow-hidden"
                  style={{ boxShadow: "var(--shadow-steep)" }}
                >
                  <img src={feature.image} alt={feature.tag} className="w-full h-full object-cover" />
                </motion.div>
              </div>

              <div
                className="card-overlay absolute inset-0 pointer-events-none z-20"
                style={{ backgroundColor: "rgba(0,0,0,1)", opacity: 0 }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}