import { Link } from "react-router-dom";
import { BarChart3, Bell, FileDown, FileSpreadsheet, History, TimerReset } from "lucide-react";
import { BRAND } from "@/config/brand";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import PageHero from "@/components/marketing/PageHero";
import SectionHeading from "@/components/marketing/SectionHeading";
import StickySteps, { type StepItem } from "@/components/marketing/StickySteps";
import Reveal from "@/components/marketing/Reveal";
import LeadForm from "@/components/marketing/LeadForm";
import FaqList from "@/components/marketing/FaqList";
import {
  CalendarVisual,
  PayoutVisual,
  RolesVisual,
  StorefrontVisual,
} from "@/components/marketing/visuals";

const STEPS: StepItem[] = [
  {
    id: "storefront",
    label: "Your booking page",
    title: "Your own page, your own link.",
    body: "Every host gets a booking page on a subdomain, or on your own domain. Share it on Instagram and WhatsApp; guests book and pay on it directly.",
    facts: ["A subdomain from day one", "Connect your own domain when you are ready", "Same escrow and record as the marketplace"],
    proof: "Your brand, our payment rails",
    visual: <StorefrontVisual />,
  },
  {
    id: "calendar",
    label: "Calendar",
    title: "One calendar for every unit.",
    body: "All your properties and room types on one timeline. A booking on your page or the marketplace blocks the same dates everywhere.",
    facts: ["Every unit on one timeline", "Turnover time blocked between guests automatically", "Unpaid requests shown apart from confirmed stays"],
    proof: "No double bookings to apologise for",
    visual: <CalendarVisual />,
  },
  {
    id: "team",
    label: "Team",
    title: "Staff see what their job needs.",
    body: "Invite your manager, front desk and accountant with roles you define. The front desk handles check-ins without seeing your payouts.",
    facts: ["Custom roles, not one admin switch", "Invitations by email", "Every action on the activity log"],
    proof: "Access that matches the job",
    visual: <RolesVisual />,
  },
  {
    id: "payouts",
    label: "Payouts",
    title: "Paid at checkout, without asking.",
    body: "Guests pay upfront into escrow. When the stay completes, your payout is released automatically. You can see every held and released amount at any time.",
    facts: ["Held amounts visible from the moment of booking", "Released automatically when the stay completes", "The platform fee is shown before you list"],
    proof: "No payout requests, no chasing",
    visual: <PayoutVisual />,
  },
];

const TOOLS = [
  { icon: FileSpreadsheet, title: "Bulk room import", body: "Bring dozens of room types in from a spreadsheet instead of typing them one by one." },
  { icon: Bell, title: "Instant notifications", body: "Bookings, check-ins and check-outs by email, SMS and in the app the moment they happen." },
  { icon: History, title: "Activity log", body: "Who changed a price, cancelled a booking or edited a listing, and when." },
  { icon: BarChart3, title: "Analytics", body: "Revenue, occupancy and booking funnel per property, not one blended number." },
  { icon: FileDown, title: "PDF exports", body: "Booking and payment reports you can send to an accountant or a co-owner." },
  { icon: TimerReset, title: "Cancellation policies", body: "Set a policy per property. Refunds from escrow follow it automatically." },
];

const FAQ = [
  { q: "What can I list?", a: "Shortlets, hotels and guesthouses. Each type has its own booking flow, room types and availability rules, set up once when you add the property." },
  { q: "When do I get paid?", a: "Guests pay upfront and the money is held in escrow. It is released to you automatically when the stay completes. You never file a payout request." },
  { q: "What does it cost?", a: "A platform fee per booking. You see the exact percentage before you list, and it is never deducted as a surprise at payout." },
  { q: "Can my team have different access?", a: "Yes. Create roles scoped to exactly what each person needs and invite them by email." },
  { q: "What happens when a guest cancels?", a: "Refunds follow the cancellation policy you set for that property, handled from escrow automatically." },
];

export default function HostsPage() {
  return (
    <MarketingLayout title="For hosts" description="Your own booking page, one calendar for every unit, roles for your team, and payouts released automatically at checkout.">
      <PageHero
        kicker="For hosts"
        title="Run your listings, not your inbox."
        lead="Your own booking page, one calendar for every unit, a team with the right access, and payouts that arrive without a request."
        actions={
          <>
            <Link to="/onboarding" className="mk-btn mk-btn-primary">
              List your property
            </Link>
            <a href="#apply" className="mk-btn mk-btn-ghost">
              Talk to us first
            </a>
          </>
        }
        aside={<CalendarVisual />}
      />

      <section className="mk-section bg-[var(--mk-surface)]" aria-labelledby="hosts-network">
        <div className="mk-container">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
            <Reveal as="h2" className="mk-h2 max-w-[14ch]">
              <span id="hosts-network">The booking is the easy part.</span>
            </Reveal>
            <Reveal index={1}>
              <p className="mk-lead">
                Anyone can take a booking on WhatsApp. What makes a hosting business run is
                everything after it: dates that never clash, staff who can do their job and no
                more, and money that arrives on time.
              </p>
            </Reveal>
          </div>
          <div className="mt-8 lg:mt-4">
            <StickySteps steps={STEPS} />
          </div>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="tools-heading">
        <div className="mk-container">
          <SectionHeading id="tools-heading" kicker="Also included" title="The tools you would otherwise build in a spreadsheet." />
          <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t, i) => (
              <Reveal as="li" index={i % 3} key={t.title} className="flex flex-col gap-3 border-t border-[var(--mk-line)] pt-6">
                <t.icon size={24} strokeWidth={1.5} className="text-[var(--mk-lagoon)]" aria-hidden="true" />
                <span className="text-[1.1875rem] font-[620] tracking-[-0.015em]">{t.title}</span>
                <span className="mk-body">{t.body}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section id="apply" className="mk-section scroll-mt-16 bg-[var(--mk-surface)]" aria-labelledby="apply-heading">
        <div className="mk-container grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
          <div className="flex flex-col gap-5">
            <p className="mk-kicker">Talk to us</p>
            <h2 id="apply-heading" className="mk-h2 max-w-[13ch]">
              Moving more than a few units?
            </h2>
            <p className="mk-lead">
              Tell us about your properties and we will help you set up, import your rooms and
              connect your domain. Or start on your own today.
            </p>
            <p className="text-[0.9375rem] text-[var(--mk-muted)]">
              Prefer email?{" "}
              <a href={`mailto:${BRAND.hostsEmail}`} className="mk-link text-[var(--mk-ink)]">
                {BRAND.hostsEmail}
              </a>
            </p>
          </div>
          <LeadForm
            kind="host_interest"
            submitLabel="Send details"
            successTitle="Details sent."
            successBody="We will reply by email within one working day with next steps for your properties."
          />
        </div>
      </section>

      <section className="mk-section" aria-labelledby="hosts-faq">
        <div className="mk-container grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <h2 id="hosts-faq" className="mk-h2 max-w-[10ch]">
            Questions hosts ask.
          </h2>
          <FaqList items={FAQ} />
        </div>
      </section>
    </MarketingLayout>
  );
}
