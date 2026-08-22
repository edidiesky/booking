import { Star, Plus } from "lucide-react";
import { motion } from "framer-motion";
import Avatar from "@/components/common/Avatar";
type Testimonial = {
  name: string;
  handle?: string;
  date?: string;
  title?: string;
  body: string;
  rating?: number;
  avatar: string;
  variant?: "quote" | "review" | "social";
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ada Nwosu",
    handle: "@adanwosu",
    avatar: "/images/avatars/ada.jpg",
    body: "Switched three properties over from spreadsheets and phone calls. The availability calendar alone paid for itself in the first week, no more double bookings.",
    variant: "quote",
  },
  {
    name: "Tunde Bakare",
    date: "Jun 14, 2026",
    title: "Finally, a real booking system",
    rating: 5,
    avatar: "/images/avatars/tunde.jpg",
    body: "Escrow was the deciding factor for me. Guests pay up front, I get paid at checkout, no chasing anyone for money. Setup took an afternoon.",
    variant: "review",
  },
  {
    name: "Chioma Eze",
    handle: "chiomaeze",
    date: "3h",
    avatar: "/images/avatars/chioma.jpg",
    body: "My new favorite dashboard for the guesthouse",
    variant: "quote",
  },
  {
    name: "Doc Ricardo",
    date: "Feb 2, 2026",
    title: "Essential for multi-property hosts",
    avatar: "/images/avatars/ricardo.jpg",
    body: "Running six shortlets used to mean six separate calendars in my head. Now it's one Gantt view, real-time, and my staff only see what their role allows. Worth the fee alone for the role permissions.",
    variant: "quote",
  },
  {
    name: "Femi Alade",
    handle: "@femialade",
    rating: 5,
    avatar: "/images/avatars/femi.jpg",
    body: "Support answered a payout question in under ten minutes on a Sunday. That alone tells you how seriously they take hosts.",
    variant: "review",
  },
  {
    name: "Blessing Okoro",
    date: "Apr 30, 2026",
    avatar: "/images/avatars/blessing.jpg",
    body: "The campaign tool got me twelve repeat bookings in a month just from emailing past guests. Did not expect that to be built in.",
    variant: "quote",
  },
];

export default function Testimonials() {
  return (
    <section
      className="w-full py-20 relative overflow-hidden"
      style={{ backgroundColor: "var(--color-canvas)" }}
    >
      <div className="mx-auto px-6 lg:px-8" style={{ maxWidth: "1280px" }}>
        <div className="flex flex-col gap-3 mb-14 text-center">
          <p
            className="text-xs lg:text-[13px]     uppercase bold"
            style={{ color: "var(--color-hint-of-grey)" }}
          >
            What hosts say
          </p>
          <h2
            className="text-3xl lg:text-5xl mx-auto "
            style={{
              color: "var(--color-ink)",
              letterSpacing: "-0.4px",
              maxWidth: "640px",
            }}
          >
            Trusted by hosts running real properties, not demos.
          </h2>
        </div>

        <div className="relative">
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name + i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                className="break-inside-avoid mb-6 rounded-2xl p-6"
                style={{
                  backgroundColor:
                    t.variant === "social"
                      ? "var(--color-ink)"
                      : "var(--color-canvas)",
                  border: t.variant === "social" ? "none" : "1px solid #e8e6e3",
                }}
              >
                {/* {t.variant === "social" ? <SocialCard t={t} /> : <StandardCard t={t} />} */}
                <StandardCard t={t} />
              </motion.div>
            ))}
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: "220px",
              background:
                "linear-gradient(to bottom, transparent, var(--color-canvas))",
            }}
          />
        </div>

        <div
          className="relative flex justify-center"
          style={{ marginTop: "-56px" }}
        >
          <div
            className="flex items-center gap-4 rounded-full pl-2 pr-5 py-2"
            style={{
              backgroundColor: "var(--color-ink)",
              boxShadow: "var(--shadow-steep)",
            }}
          >
            <div className="flex -space-x-2">
              {TESTIMONIALS.slice(0, 3).map((t) => (
                <Avatar
                  src={t.avatar}
                  email={"hello@gmail.com"}
                  name={t.name[0]}
                  size={32}
                />
              ))}
            </div>
            <span className="text-sm text-white">
              2,000+ hosts trust the platform
            </span>
            <button
              className="flex items-center gap-1 text-sm rounded-full px-3 py-1"
              style={{
                backgroundColor: "var(--color-terracotta)",
                color: "var(--color-ink)",
              }}
            >
              View more <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StandardCard({ t }: { t: Testimonial }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar
          src={t.avatar}
          email={"hello@gmail.com"}
          name={t.name[0]}
          size={42}
        />
        <div className="flex flex-col">
          <span className="text-base lg:text-lg bold" style={{ color: "var(--color-ink)" }}>
            {t.name}
          </span>
          {t.handle ? (
            <span
              className="text-sm lg:text-sm bold"
              style={{ color: "var(--color-hint-of-grey)" }}
            >
              {t.handle}
            </span>
          ) : t.date ? (
            <span
              className="text-sm lg:text-sm bold"
              style={{ color: "var(--color-hint-of-grey)" }}
            >
              {t.date}
            </span>
          ) : null}
        </div>
      </div>

      {t.title && (
        <h3 className="text-base lg:text-lg  bold" style={{ color: "var(--color-ink)" }}>
          {t.title}
        </h3>
      )}

      {t.rating && (
        <div className="flex gap-0.5">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star
              key={i}
              size={14}
              fill="var(--color-terracotta)"
              color="var(--color-terracotta)"
            />
          ))}
        </div>
      )}

      <p
        className="text-base lg:text-lg bold leading-relaxed"
        style={{ color: "var(--color-muted-stone)" }}
      >
        {t.body}
      </p>
    </div>
  );
}

// function SocialCard({ t }: { t: Testimonial }) {
//   return (
//     <div className="flex flex-col gap-4">
//       <div className="flex items-center gap-2">
//         <Avatar className="w-8 h-8">
//           <AvatarImage src={t.avatar} alt={t.name} />
//           <AvatarFallback>{t.name[0]}</AvatarFallback>
//         </Avatar>
//         <div className="flex items-center gap-1">
//           <span className="text-sm bold text-white">{t.name}</span>
//           <CheckCircle2 size={14} color="var(--color-terracotta)" fill="var(--color-terracotta)" />
//         </div>
//         <span className="text-xs lg:text-[13px]   ml-auto" style={{ color: "#9a9a9a" }}>{t.date}</span>
//       </div>
//       <p className="text-sm text-white">{t.body}</p>
//       <div className="w-full rounded-lg overflow-hidden" style={{ height: "160px", backgroundColor: "#2a2a2a" }} />
//     </div>
//   );
// }
