import { Link } from "react-router-dom";
import { BedDouble, Building, Home } from "lucide-react";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import PageHero from "@/components/marketing/PageHero";
import SectionHeading from "@/components/marketing/SectionHeading";
import Reveal from "@/components/marketing/Reveal";
import FloorPlanHotspots from "@/components/marketing/FloorPlanHotspots";
import FaqList from "@/components/marketing/FaqList";
import CtaBand from "@/components/marketing/CtaBand";
import HeroSearch from "@/components/marketing/HeroSearch";
import FeaturedListings from "@/components/listing/FeaturedListings";
import { LISTING_SPOTS } from "../Landing/home.sections";

const TYPES = [
  {
    icon: Home,
    title: "Shortlets",
    body: "Whole apartments and houses for a few nights or a few weeks. Your own kitchen, your own keys.",
    to: "/search?propertyType=shortlet",
    cta: "Browse shortlets",
  },
  {
    icon: Building,
    title: "Hotels",
    body: "Rooms with a front desk and room types you can compare side by side, priced per night.",
    to: "/search?propertyType=hotel",
    cta: "Browse hotels",
  },
  {
    icon: BedDouble,
    title: "Guesthouses",
    body: "Smaller, host-run places. Often the best value in the neighbourhood you actually want.",
    to: "/search?propertyType=guesthouse",
    cta: "Browse guesthouses",
  },
];

const STEPS = [
  { title: "Find it", body: "Search by area, type and guests. The price on the card is the nightly price." },
  { title: "Book and pay", body: "Pay through Paystack or Flutterwave. The money goes into escrow, not to the host." },
  { title: "Check in", body: "Arrive at the time on your booking. The details live in the app, not a chat thread." },
  { title: "Check out", body: "When the stay completes, the host is paid automatically. Then you can leave a review." },
];

const FAQ = [
  { q: "Is the price on the card the full price?", a: "It is the nightly price for the cheapest unit in that listing. Any fee is shown before you pay, never added after." },
  { q: "When does the host get my money?", a: "When your stay completes. Until then it is held in escrow. The host can see the booking is paid but cannot withdraw it." },
  { q: "What if I need to cancel?", a: "Each property sets its cancellation policy, and you see it before you book. Refunds from escrow follow that policy automatically." },
  { q: "Can I book for someone else?", a: "Yes. Book under your account and add the guest's name. The record stays with you." },
];

export default function StaysPage() {
  return (
    <MarketingLayout title="Stays" description="Shortlets, hotels and guesthouses from verified hosts, with your payment held until the stay is done.">
      <PageHero
        kicker="Stays"
        title="Book the place, not the gamble."
        lead="Shortlets, hotels and guesthouses from verified hosts. Every listing answers the questions you would ask before you pay."
        actions={<HeroSearch />}
      />

      <section className="mk-section bg-[var(--mk-surface)]" aria-labelledby="types-heading">
        <div className="mk-container">
          <SectionHeading id="types-heading" kicker="What you can book" title="Three kinds of stay, one set of rules." />
          <ul className="grid gap-4 md:grid-cols-3">
            {TYPES.map((t, i) => (
              <Reveal as="li" index={i} key={t.title}>
                <Link to={t.to} className="group/type flex h-full flex-col gap-4 rounded-[20px] bg-[var(--mk-paper)] p-7 transition-[background-color] duration-150 ease-out hover:bg-[var(--mk-lagoon-tint)]">
                  <t.icon size={26} strokeWidth={1.5} className="text-[var(--mk-lagoon)]" aria-hidden="true" />
                  <span className="text-[1.5rem] font-[620] tracking-[-0.02em]">{t.title}</span>
                  <span className="mk-body flex-1">{t.body}</span>
                  <span className="text-[0.9375rem] font-[560] text-[var(--mk-lagoon)]">{t.cta}</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="checks-heading">
        <div className="mk-container grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <div className="flex flex-col gap-5">
            <Reveal>
              <p className="mk-kicker">Before it goes live</p>
            </Reveal>
            <Reveal index={1} as="h2" className="mk-h2 max-w-[14ch]">
              <span id="checks-heading">What every listing has to show.</span>
            </Reveal>
            <Reveal index={2}>
              <p className="mk-lead">
                Tap the points on the plan, or switch to the checklist. If a listing cannot answer
                one of these, it is not published.
              </p>
            </Reveal>
          </div>
          <Reveal index={1}>
            <FloorPlanHotspots spots={LISTING_SPOTS} />
          </Reveal>
        </div>
      </section>

      <section className="mk-section bg-[var(--mk-surface)]" aria-labelledby="steps-heading">
        <div className="mk-container">
          <SectionHeading id="steps-heading" kicker="How booking works" title="Four steps, one record." />
          <ol className="grid gap-px overflow-hidden rounded-[20px] bg-[var(--mk-line)] md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <Reveal as="li" index={i} key={s.title} className="flex flex-col gap-3 bg-[var(--mk-surface)] p-7">
                <span className="mk-num text-[0.9375rem] font-[600] text-[var(--mk-brass)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[1.25rem] font-[620] tracking-[-0.02em]">{s.title}</span>
                <span className="mk-body">{s.body}</span>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <FeaturedListings title="Live right now" lead="A few of the newest verified listings." />

      <section className="mk-section bg-[var(--mk-surface)]" aria-labelledby="stays-faq">
        <div className="mk-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <h2 id="stays-faq" className="mk-h2 max-w-[10ch]">
            Questions guests ask.
          </h2>
          <FaqList items={FAQ} />
        </div>
      </section>

      <div className="pt-[clamp(4.5rem,3rem+6vw,8.5rem)]">
        <CtaBand
          title="Find a stay you will not have to explain later."
          body="Verified hosts, the money on hold, and a record of every step."
          primary={{ label: "Find a stay", to: "/search" }}
          secondary={{ label: "How the money works", to: "/how-it-works" }}
        />
      </div>
    </MarketingLayout>
  );
}
