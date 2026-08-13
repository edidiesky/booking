import { useRef } from "react";
import { CalendarCheck, ShieldCheck, Bell, Wallet } from "lucide-react";
import AnimateTextWord from "@/components/common/AnimateTextWord";

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
    bg: "#e8c4b8", color: "#2b1a12",
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
    bg: "#dde3c0", color: "#1d2212",
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
    bg: "#c9d6e8", color: "#121a24",
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
    bg: "#e6d3a3", color: "#241c0c",
    image: "/images/hero/feature4.jpg",
  },
];

export default function Expert() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section style={{ backgroundColor: "var(--color-canvas)" }}>
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

      <div ref={containerRef} className="card-stack mx-auto px-6 lg:px-8" style={{ maxWidth: "90rem" }}>
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <div key={i} className="card-stack__item shadow-sm bg-white border" style={{ color: feature.color }}>
              <div className="card-stack__item-inner">
                <div className="grid lg:grid-cols-2 gap-16 items-center w-full h-full">
                  <div className="flex flex-col gap-6">
                    <span
                      className="text-base px-3 py-1.5 rounded-full w-fit flex items-center gap-2"
                      style={{ backgroundColor: `${feature.color}14`, color: feature.color }}
                    >
                      <Icon size={14} /> {feature.tag}
                    </span>
                    <h3 className="text-3xl lg:text-5xl leading-[1.4]" style={{ letterSpacing: "-0.66px" }}>
                      {feature.title}
                    </h3>
                    <ul className="flex flex-col gap-3">
                      {feature.bullets.map((bullet, j) => (
                        <li key={j} className="flex items-start gap-3 text-lg leading-relaxed" style={{ opacity: 0.75 }}>
                          <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: feature.color }} />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="w-full h-full rounded-[24px] overflow-hidden">
                    <img src={feature.image} alt={feature.tag} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}