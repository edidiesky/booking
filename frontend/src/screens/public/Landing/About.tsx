import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AnimateTextWord from "@/components/common/AnimateTextWord";

gsap.registerPlugin(ScrollTrigger);

const cards = [
  {
    image: "https://2025.moniepoint.com/_next/static/media/POS.d298f7b6.svg",
    value: "12,000+",
    label: "Bookings confirmed",
    description:
      "Real stays, real guests, across every property type on the platform.",
    bg: "#e8e6e3",
    color: "#111111",
  },
  {
    image: "https://2025.moniepoint.com/_next/static/media/Fruit.527795c5.svg",
    value: "850+",
    label: "Properties listed",
    description: "Shortlets, hotels, and guesthouses, all in one calendar.",
    bg: "#f8e600",
    color: "#111111",
  },
  {
    image: "https://2025.moniepoint.com/_next/static/media/POS.d298f7b6.svg",
    value: "₦2B+",
    label: "Host payouts released",
    description:
      "Held in escrow, released automatically at checkout, no chasing payments.",
    bg: "#00a86b",
    color: "#ffffff",
  },
  {
    image: "https://2025.moniepoint.com/_next/static/media/Fruit.527795c5.svg",
    value: "3hr",
    label: "Turnover buffer, automatic",
    description:
      "The calendar blocks cleaning time between guests, so you never double-book by accident.",
    bg: "#1a56ff",
    color: "#ffffff",
  },
  {
    image: "https://2025.moniepoint.com/_next/static/media/POS.d298f7b6.svg",
    value: "99.9%",
    label: "Uptime, every night",
    description: "Your booking calendar doesn't go down during a busy weekend.",
    bg: "#17191c",
    color: "#ffffff",
  },
  {
    image: "https://2025.moniepoint.com/_next/static/media/POS.d298f7b6.svg",
    value: "24/7",
    label: "Guest support",
    description: "Someone's awake when a 2am check-in question comes in.",
    bg: "#dc2626",
    color: "#ffffff",
  },
];

// Finite arc carousel: cards sit at fixed points along a shallow arc
// (center highest and upright, edges dip down and tilt outward), and
// scroll position drives a continuous "virtual index" that shifts
// every card's position along that same arc. Hard-clamped between the
// first and last card, no wraparound.
//
// The header is NOT part of the pinned section anymore, it's a plain,
// normal-flow block above it that scrolls away like any other content.
// Only the cards stage gets pinned. That's what makes a fixed 580px
// card height comfortable again: the pinned section no longer has to
// share its height with a header block, the full viewport is
// available to the cards once the header has already scrolled past.
const ANGLE_STEP_DEG = 40;
const ARC_RADIUS = 900;
const TOP_Y = 80; // small top padding now, not "room for the header", the header isn't in this section anymore
const CARD_HEIGHT = 680;
const MAX_DIP = 90

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
      <div className="mx-auto px-6 lg:px-8 pt-32 pb-10 flex items-center justify-center flex-col" style={{ maxWidth: "1280px" }}>
        <span className="text-xs lg:text-xl uppercase" style={{ color: "var(--color-light-steel)" }}>
          Everything you need
        </span>
        <h3 className=" text-4xl lg:text-6xl lg:text-center mx-auto max-w-[800px] bold text-[var(--dark-1)]">
          {/* <AnimateTextWord type={"bigtext"}>
            Built for hosts who don't have time to babysit a calendar.
          </AnimateTextWord> */}
          Built for hosts who don't have time to babysit a calendar.
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
                className="text-5xl lg:text-6xl  leading-none"
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
                className="text-xs lg:text-xl leading-relaxed mt-auto"
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
