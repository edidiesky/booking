import { Link } from "react-router-dom";
import { BadgeCheck, KeyRound, MessageSquareText, ShieldCheck } from "lucide-react";
import { BRAND } from "@/config/brand";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import PageHero from "@/components/marketing/PageHero";
import SectionHeading from "@/components/marketing/SectionHeading";
import Reveal from "@/components/marketing/Reveal";
import FaqList from "@/components/marketing/FaqList";
import CtaBand from "@/components/marketing/CtaBand";
import { EscrowVisual } from "@/components/marketing/visuals";

const PILLARS = [
  {
    id: "verification",
    icon: BadgeCheck,
    title: "Host verification",
    body: "Hosts confirm their identity before a listing is published. A listing belongs to a named, verified account, never an anonymous one.",
    points: ["Identity confirmed before the first listing", "One account per host across every property", "Listings removed when verification lapses"],
  },
  {
    id: "reviews",
    icon: MessageSquareText,
    title: "Reviews from real stays",
    body: "Only a guest with a completed, paid booking can review that stay. Hosts can reply in public; they cannot edit or remove a review.",
    points: ["Tied to a completed booking", "Host replies are public and dated", "No reviews for stays that did not happen"],
  },
  {
    id: "cancellations",
    icon: ShieldCheck,
    title: "Cancellations, set in advance",
    body: "Every property shows its cancellation policy before you pay. Because the money is in escrow, refunds follow that policy without anyone having to agree twice.",
    points: ["Policy visible on the listing", "Refunds paid from escrow", "Partial refunds calculated automatically"],
  },
  {
    id: "security",
    icon: KeyRound,
    title: "Account security",
    body: "Two-factor sign-in, an optional sign-in PIN, and a log of where your account was used. Your card details are handled by the payment provider, not stored by us.",
    points: ["Two-factor sign-in", "Sign-in PIN", "Payments through Paystack or Flutterwave"],
  },
];

const WRONG = [
  { title: "Tell us from the booking", body: "Report the problem from your booking, ideally within the first hours of check-in. Photos help." },
  { title: "The payout stays held", body: "While a report is open on a booking, the host's payout is not released." },
  { title: "We check the record", body: "The listing, the messages and every timestamped step of the booking are reviewed together." },
  { title: "Refund or release", body: "You are refunded under the policy, or the payout is released, with the reason written on the record." },
];

const FAQ = [
  { q: "Do you inspect every property?", a: "We verify every host and require each listing to answer the same questions on power, water, security and check-in. Where a guest reports a listing was wrong, the payout is held while we look." },
  { q: "Can a host see my payment?", a: "They can see that the booking is paid. They cannot withdraw the money until the stay completes." },
  { q: "Who decides a dispute?", a: `${BRAND.name} does, using the booking record, the listing and the messages. The reason is written on the record either way.` },
  { q: "How do I report a host or listing?", a: `From the booking, or by writing to ${BRAND.supportEmail} with the booking reference.` },
];

export default function TrustPage() {
  return (
    <MarketingLayout title="Trust" description="How hosts are verified, how reviews are earned, and what happens when a stay goes wrong.">
      <PageHero
        kicker="Trust"
        title="Not a marketplace of strangers."
        lead="How hosts are verified, how reviews are earned, and what happens when a stay is not what was listed."
        actions={
          <Link to="/search" className="mk-btn mk-btn-primary">
            Find a verified stay
          </Link>
        }
      />

      <section className="mk-section bg-[var(--mk-surface)]" aria-labelledby="pillars-heading">
        <div className="mk-container">
          <h2 id="pillars-heading" className="sr-only">
            How trust works
          </h2>
          <div className="flex flex-col">
            {PILLARS.map((p) => (
              <article
                key={p.id}
                id={p.id}
                className="grid scroll-mt-20 gap-6 border-t border-[var(--mk-line)] py-12 first:border-t-0 first:pt-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16"
              >
                <Reveal className="flex flex-col gap-4">
                  <p.icon size={28} strokeWidth={1.5} className="text-[var(--mk-lagoon)]" aria-hidden="true" />
                  <h3 className="mk-h3">{p.title}</h3>
                </Reveal>
                <Reveal index={1} className="flex flex-col gap-5">
                  <p className="mk-lead">{p.body}</p>
                  <ul className="flex flex-wrap gap-2">
                    {p.points.map((pt) => (
                      <li key={pt} className="rounded-full bg-[var(--mk-paper)] px-3.5 py-2 text-[0.875rem] font-[520]">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="wrong-heading">
        <div className="mk-container grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-20">
          <div>
            <SectionHeading
              id="wrong-heading"
              kicker="If a stay goes wrong"
              title="The host is not paid while we look."
              align="stack"
            />
            <ol className="flex flex-col">
              {WRONG.map((w, i) => (
                <Reveal as="li" index={i} key={w.title} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 border-t border-[var(--mk-line)] py-6">
                  <span className="mk-num pt-0.5 text-[0.9375rem] font-[600] text-[var(--mk-brass)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-[1.1875rem] font-[620] tracking-[-0.015em]">{w.title}</span>
                    <span className="mk-body mt-1.5 block">{w.body}</span>
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
          <Reveal index={1} className="lg:sticky lg:top-24">
            <EscrowVisual />
          </Reveal>
        </div>
      </section>

      <section className="mk-section bg-[var(--mk-surface)]" aria-labelledby="trust-faq">
        <div className="mk-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <h2 id="trust-faq" className="mk-h2 max-w-[10ch]">
            Straight answers.
          </h2>
          <FaqList items={FAQ} />
        </div>
      </section>

      <div className="pt-[clamp(4.5rem,3rem+6vw,8.5rem)]">
        <CtaBand
          title="Book from people who answer to us."
          body="Verified hosts, reviews from real stays, and the money held until checkout."
          primary={{ label: "Find a stay", to: "/search" }}
          secondary={{ label: "How the money works", to: "/how-it-works" }}
        />
      </div>
    </MarketingLayout>
  );
}
