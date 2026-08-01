import { Star, CheckCircle2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "../../../components/ui/avatar";

type Testimonial = {
  name: string;
  handle?: string;
  date?: string;
  title?: string;
  body: string;
  rating?: number;
  avatar?: string;
  variant?: "quote" | "review" | "social";
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ada Nwosu",
    handle: "@adanwosu",
    body: "Switched three properties over from spreadsheets and phone calls. The availability calendar alone paid for itself in the first week, no more double bookings.",
    variant: "quote",
  },
  {
    name: "Tunde Bakare",
    date: "Jun 14, 2026",
    title: "Finally, a real booking system",
    rating: 5,
    body: "Escrow was the deciding factor for me. Guests pay up front, I get paid at checkout, no chasing anyone for money. Setup took an afternoon.",
    variant: "review",
  },
  {
    name: "Chioma Eze",
    handle: "chiomaeze",
    date: "3h",
    body: "My new favorite dashboard for the guesthouse",
    avatar: "/images/testimonials/chioma.jpg",
    variant: "quote",
  },
  {
    name: "Doc Ricardo",
    date: "Feb 2, 2026",
    title: "Essential for multi-property hosts",
    body: "Running six shortlets used to mean six separate calendars in my head. Now it's one Gantt view, real-time, and my staff only see what their role allows. Worth the fee alone for the role permissions.",
    variant: "quote",
  },
  {
    name: "Femi Alade",
    handle: "@femialade",
    rating: 5,
    body: "Support answered a payout question in under ten minutes on a Sunday. That alone tells you how seriously they take hosts.",
    variant: "review",
  },
  {
    name: "Blessing Okoro",
    date: "Apr 30, 2026",
    body: "The campaign tool got me twelve repeat bookings in a month just from emailing past guests. Did not expect that to be built in.",
    variant: "quote",
  },
   {
    name: "Tunde Bakare",
    date: "Jun 14, 2026",
    title: "Finally, a real booking system",
    rating: 5,
    body: "Escrow was the deciding factor for me. Guests pay up front, I get paid at checkout, no chasing anyone for money. Setup took an afternoon.",
    variant: "review",
  },
  {
    name: "Chioma Eze",
    handle: "chiomaeze",
    date: "3h",
    body: "My new favorite dashboard for the guesthouse",
    avatar: "/images/testimonials/chioma.jpg",
    variant: "quote",
  },
  {
    name: "Doc Ricardo",
    date: "Feb 2, 2026",
    title: "Essential for multi-property hosts",
    body: "Running six shortlets used to mean six separate calendars in my head. Now it's one Gantt view, real-time, and my staff only see what their role allows. Worth the fee alone for the role permissions.",
    variant: "quote",
  },
  {
    name: "Femi Alade",
    handle: "@femialade",
    rating: 5,
    body: "Support answered a payout question in under ten minutes on a Sunday. That alone tells you how seriously they take hosts.",
    variant: "review",
  },
  {
    name: "Blessing Okoro",
    date: "Apr 30, 2026",
    body: "The campaign tool got me twelve repeat bookings in a month just from emailing past guests. Did not expect that to be built in.",
    variant: "quote",
  },
];

export default function Testimonials() {
  return (
    <section className="w-full py-20 relative overflow-hidden" style={{ backgroundColor: "var(--color-canvas)" }}>
      <div className="mx-auto px-6 lg:px-8" style={{ maxWidth: "1280px" }}>
        <div className="flex flex-col gap-3 mb-14 text-center">
          <p className="text-xs uppercase bold" style={{ color: "var(--color-hint-of-grey)" }}>
            What hosts say
          </p>
          <h2
            className="text-3xl lg:text-5xl mx-auto leading-[1.1]"
            style={{ color: "var(--color-ink)", letterSpacing: "-0.4px", maxWidth: "640px" }}
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
                  backgroundColor: t.variant === "social" ? "var(--color-ink)" : "var(--color-canvas)",
                  border: t.variant === "social" ? "none" : "1px solid #e8e6e3",
                }}
              >
                {/* {t.variant === "social" ? (
                  <SocialCard t={t} />
                ) : (
                  <StandardCard t={t} />
                )} */}
                <StandardCard t={t} />
              </motion.div>
            ))}
          </div>

          {/* fade-out gradient, masks the bottom row into the section background */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: "220px",
              background: "linear-gradient(to bottom, transparent, var(--color-canvas))",
            }}
          />
        </div>

        {/* floating stat pill, overlaps the faded-out bottom row */}
        <div className="relative flex justify-center" style={{ marginTop: "-56px" }}>
          <div
            className="flex items-center gap-4 rounded-full pl-2 pr-5 py-2"
            style={{ backgroundColor: "var(--color-ink)", boxShadow: "var(--shadow-steep)" }}
          >
            <div className="flex -space-x-2">
              {["/images/avatars/host1.jpg", "/images/avatars/host2.jpg", "/images/avatars/host3.jpg"].map((src, i) => (
                <Avatar key={i} className="w-7 h-7 border-2" style={{ borderColor: "var(--color-ink)" }}>
                  <AvatarImage src={src} alt="" />
                  <AvatarFallback>H</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-sm text-white">2,000+ hosts trust the platform</span>
            <button className="flex items-center gap-1 text-sm rounded-full px-3 py-1" style={{ backgroundColor: "var(--color-terracotta)", color: "var(--color-ink)" }}>
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
      {t.title && (
        <h3 className="text-base bold" style={{ color: "var(--color-ink)" }}>
          {t.title}
        </h3>
      )}

      {(t.date || t.name) && (
        <div className="flex items-center justify-between">
          <span className="text-sm bold" style={{ color: "var(--color-ink)" }}>
            {t.name}
          </span>
          {t.date && (
            <span className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>
              {t.date}
            </span>
          )}
        </div>
      )}

      {t.handle && !t.title && (
        <span className="text-xs" style={{ color: "var(--color-hint-of-grey)" }}>
          {t.handle}
        </span>
      )}

      {t.rating && (
        <div className="flex gap-0.5">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} size={14} fill="var(--color-terracotta)" color="var(--color-terracotta)" />
          ))}
        </div>
      )}

      <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted-stone)" }}>
        {t.body}
      </p>
    </div>
  );
}

function SocialCard({ t }: { t: Testimonial }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={t.avatar} alt={t.name} />
          <AvatarFallback>{t.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1">
          <span className="text-sm bold text-white">{t.name}</span>
          <CheckCircle2 size={14} color="var(--color-terracotta)" fill="var(--color-terracotta)" />
        </div>
        <span className="text-xs ml-auto" style={{ color: "#9a9a9a" }}>
          {t.date}
        </span>
      </div>
      <p className="text-sm text-white">{t.body}</p>
      <div className="w-full rounded-lg overflow-hidden" style={{ height: "160px", backgroundColor: "#2a2a2a" }} />
    </div>
  );
}