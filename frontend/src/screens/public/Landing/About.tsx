import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimateTextWord from "@/components/common/AnimateTextWord";

gsap.registerPlugin(ScrollTrigger);

const cards = [
  {
    image: "https://2025.moniepoint.com/_next/static/media/POS.d298f7b6.svg",
    value: "12,000+",
    label: "Bookings confirmed to date",
    description:
      "Across shortlets, hotels, and guesthouses, tracked in real time, not end-of-day batch counts.",
    bg: "#e8e6e3",
    color: "#111111",
  },
  {
    image: "https://2025.moniepoint.com/_next/static/media/Fruit.527795c5.svg",
    value: "850+",
    label: "Properties actively listed",
    description:
      "Live inventory across three property types, one shared calendar per host.",
    bg: "#f8e600",
    color: "#111111",
  },
  {
    image: "https://2025.moniepoint.com/_next/static/media/POS.d298f7b6.svg",
    value: "₦2.14B",
    label: "Released to hosts via escrow",
    description:
      "Held from booking to checkout, released automatically, zero manual payout requests.",

    bg: "#00a86b",
    color: "#ffffff",
  },
  {
    image: "https://2025.moniepoint.com/_next/static/media/Fruit.527795c5.svg",
    value: "3hr",
    label: "Turnover buffer, enforced automatically",
    description:
      "Blocked between every checkout and next check-in, no host has to remember to set it.",
    bg: "#1a56ff",
    color: "#ffffff",
  },
  {
    image: "https://2025.moniepoint.com/_next/static/media/POS.d298f7b6.svg",
    value: "99.99%",
    label: "Platform uptime, trailing 90 days",
    description:
      "Measured against the booking and payment paths specifically, not marketing-page uptime.",
    bg: "#17191c",
    color: "#ffffff",
  },
  {
    image: "https://2025.moniepoint.com/_next/static/media/POS.d298f7b6.svg",
    value: "< 4min",
    label: "Median first response time",
    description:
      "Guest and host support, including overnight, not just business hours.",
    bg: "#dc2626",
    color: "#ffffff",
  },
];

const ANGLE_STEP_DEG = 40;
const ARC_RADIUS = 900;
const TOP_Y = 80;
const CARD_HEIGHT = 680;

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const ctx = gsap.context(() => {
      const layout = (virtualIndex: number) => {
        const centerX = stage.offsetWidth / 2;

        cards.forEach((_, i) => {
          const card = cardRefs.current[i];
          if (!card) return;

          const angleDeg = (i - virtualIndex) * ANGLE_STEP_DEG;
          const angleRad = (angleDeg * Math.PI) / 180;

          const x = centerX + ARC_RADIUS * Math.sin(angleRad);
          const y = TOP_Y + ARC_RADIUS * (1 - Math.cos(angleRad));

          gsap.set(card, {
            x,
            y,
            xPercent: -50,
            yPercent: 0,
            height: CARD_HEIGHT,
            rotation: angleDeg * 0.6,
            opacity: Math.abs(angleDeg) > ANGLE_STEP_DEG * 3.2 ? 0 : 1,
          });
        });
      };

      let currentIndex = 0;
      const maxIndex = cards.length - 1;

      layout(currentIndex);
      window.addEventListener("resize", () => layout(currentIndex));

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=150%",
        scrub: 1,
        pin: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          currentIndex = gsap.utils.clamp(
            0,
            maxIndex,
            self.progress * maxIndex,
          );
          layout(currentIndex);
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div style={{ backgroundColor: "var(--color-canvas)" }}>
      <div
        className="px-6 mx-auto lg:px-8 pt-32 pb-10 flex flex-col"
        style={{ maxWidth: "1280px" }}
      >
        <span
          className="text-xs lg:text-[13px]    lg:text-xl uppercase"
          style={{ color: "var(--color-light-steel)" }}
        >
          Everything you need
        </span>
        <h3
          className="text-4xl lg:text-6xl mt-2 max-w-3xl"
          style={{ color: "var(--color-ink)", letterSpacing: "-0.66px" }}
        >
          <AnimateTextWord type="bigtext">
            Built for hosts who don't have time to babysit a calendar.
            {/* Availability updates the moment a booking comes in, so nothing gets
            double-booked while you're busy actually running the place. */}
          </AnimateTextWord>
        </h3>
      </div>
      <section ref={sectionRef} className="relative h-screen overflow-hidden">
        <div
          ref={stageRef}
          className="absolute inset-0"
          style={{ willChange: "transform" }}
        >
          {cards.map((card, i) => (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="absolute top-0 w-[300px] lg:w-[440px] min-h-[680px] rounded-[24px] p-8 flex flex-col gap-6 lg:gap-8 overflow-hidden"
              style={{
                backgroundColor: card.bg,
              }}
            >
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10"
                style={{ backgroundColor: card.color }}
              />
              <p
                className="text-4xl lg:text-6xl  leading-none"
                style={{ color: card.color }}
              >
                {card.value}
              </p>
              <p
                className="text-xl  leading-snug"
                style={{ color: card.color }}
              >
                {card.label}
              </p>
              <p
                className="text-base lg:text-xl leading-relaxed mt-auto"
                style={{ color: `${card.color}99` }}
              >
                {card.description}
              </p>
              <div className="w-full">
                <img
                  src={card.image}
                  // alt={stat.tag}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
