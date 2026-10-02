import { Link } from "react-router-dom";
import { BRAND } from "@/config/brand";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import PageHero from "@/components/marketing/PageHero";
import SectionHeading from "@/components/marketing/SectionHeading";
import Reveal from "@/components/marketing/Reveal";
import KeyTag, { SAMPLE_RECORD } from "@/components/marketing/KeyTag";
import CompareTabs from "@/components/marketing/CompareTabs";
import FaqList from "@/components/marketing/FaqList";
import CtaBand from "@/components/marketing/CtaBand";
import { EscrowVisual } from "@/components/marketing/visuals";
import { ESCROW_TABS } from "../Landing/home.sections";

const MONEY = [
  { when: "At booking", guest: "You pay the full amount through Paystack or Flutterwave.", host: "Sees a paid booking. Cannot withdraw." },
  { when: "Before check-in", guest: "Cancel under the listing's policy; refunds come from escrow.", host: "The dates are blocked on every calendar." },
  { when: "During the stay", guest: "Report a problem from the booking if the place is not as listed.", host: "Payout stays held while a report is open." },
  { when: "At checkout", guest: "Your stay is complete. You can leave a review.", host: "Payout released automatically." },
];

const RECORD_NOTES: Record<string, string> = {
  Requested: "Dates, unit, guests and the exact price you saw.",
  "Paid, held in escrow": "Payment reference from the provider and the amount held.",
  "Checked in": "When the stay began.",
  "Checked out": "When the stay ended and turnover began.",
  "Released to host": "The payout amount and when it left escrow.",
};

const FAQ = [
  { q: "Why not pay the host directly?", a: "Because once the money is with the host, a problem becomes a negotiation. In escrow, the money waits for the stay to happen as listed." },
  { q: "Is my money safe while it is held?", a: "It is collected by a licensed payment provider and held until the stay completes. Card details never touch our servers." },
  { q: "Who can see the record?", a: "You, the host and their permitted staff, and our team when a booking is reported. Nobody else." },
  { q: "Do I pay more for escrow?", a: "No. The price you see is what you pay. Hosts pay a platform fee from their side, shown to them before they list." },
];

export default function HowItWorksPage() {
  return (
    <MarketingLayout title="How it works" description="Where your payment waits, when the host is paid, and the record every booking leaves.">
      <PageHero
        kicker="How it works"
        title="The money and the record."
        lead="Where your payment waits, when the host is paid, and the timestamped record every booking leaves behind."
        actions={
          <>
            <Link to="/search" className="mk-btn mk-btn-primary">
              Find a stay
            </Link>
            <a href="#escrow" className="mk-btn mk-btn-ghost">
              Follow the money
            </a>
          </>
        }
        aside={
          <div className="mx-auto max-w-[400px] pt-4 lg:mr-0">
            <KeyTag
              autoplay
              reference="Booking KH-20418"
              title="Two-bed apartment, Lekki"
              steps={SAMPLE_RECORD}
              footer={{ label: "Released to host", value: "₦340,000" }}
            />
          </div>
        }
      />

      <section id="escrow" className="mk-section scroll-mt-16 bg-[var(--mk-surface)]" aria-labelledby="money-heading">
        <div className="mk-container">
          <SectionHeading
            id="money-heading"
            kicker="Escrow"
            title="Where the money is, at every step."
            lead="One booking, read from both sides. The guest column is what you do; the host column is what the host can and cannot do with your money."
          />
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:items-start">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <thead>
                  <tr className="text-[0.875rem] text-[var(--mk-muted)]">
                    <th scope="col" className="w-[9rem] pb-3 font-[560]">When</th>
                    <th scope="col" className="pb-3 font-[560]">You, the guest</th>
                    <th scope="col" className="pb-3 font-[560]">The host</th>
                  </tr>
                </thead>
                <tbody>
                  {MONEY.map((m) => (
                    <tr key={m.when} className="border-t border-[var(--mk-line)] align-top">
                      <th scope="row" className="py-5 pr-4 text-[1rem] font-[600]">{m.when}</th>
                      <td className="mk-body py-5 pr-6">{m.guest}</td>
                      <td className="mk-body py-5">{m.host}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Reveal className="lg:sticky lg:top-24">
              <EscrowVisual />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="compare-heading">
        <div className="mk-container">
          <SectionHeading id="compare-heading" kicker="Compared" title="The same booking, paid two ways." />
          <CompareTabs tabs={ESCROW_TABS} />
        </div>
      </section>

      <section id="record" className="mk-section scroll-mt-16 bg-[var(--mk-surface)]" aria-labelledby="record-heading">
        <div className="mk-container grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20">
          <div>
            <SectionHeading
              id="record-heading"
              kicker="The record"
              title="Every step, with a time on it."
              lead="If anything is ever in question, this is what we look at. You can see it too, from your booking."
              align="stack"
            />
            <ol className="flex flex-col">
              {SAMPLE_RECORD.map((s, i) => (
                <Reveal as="li" index={i} key={s.label} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 border-t border-[var(--mk-line)] py-5">
                  <span className="mk-num pt-0.5 text-[0.9375rem] font-[600] text-[var(--mk-brass)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-[1.125rem] font-[620] tracking-[-0.015em]">{s.label}</span>
                    <span className="mk-body mt-1 block">{RECORD_NOTES[s.label]}</span>
                  </span>
                </Reveal>
              ))}
            </ol>
          </div>
          <Reveal index={1} className="mx-auto w-full max-w-[400px] pt-6 lg:sticky lg:top-24 lg:self-start">
            <KeyTag
              reference="Booking KH-20418"
              title="Two-bed apartment, Lekki"
              steps={SAMPLE_RECORD}
              completed={SAMPLE_RECORD.length}
              footer={{ label: "Released to host", value: "₦340,000" }}
            />
          </Reveal>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="hiw-faq">
        <div className="mk-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <h2 id="hiw-faq" className="mk-h2 max-w-[10ch]">
            About the money.
          </h2>
          <FaqList items={FAQ} />
        </div>
      </section>

      <CtaBand
        title={`Book with ${BRAND.name} and the money waits for you.`}
        body="Pay once at booking. The host is paid when your stay is done."
        primary={{ label: "Find a stay", to: "/search" }}
        secondary={{ label: "For hosts", to: "/hosts" }}
      />
    </MarketingLayout>
  );
}
