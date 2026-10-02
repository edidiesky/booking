import { Link } from "react-router-dom";
import { Apple, Smartphone } from "lucide-react";
import { BRAND } from "@/config/brand";
import Reveal from "@/components/marketing/Reveal";
import HeroSearch from "@/components/marketing/HeroSearch";
import KeyTag, { SAMPLE_RECORD } from "@/components/marketing/KeyTag";
import StickySteps, { type StepItem } from "@/components/marketing/StickySteps";
import { CityMapVisual, EscrowVisual } from "@/components/marketing/visuals";
import FloorPlanHotspots, {
  type Hotspot,
} from "@/components/marketing/FloorPlanHotspots";
import CompareTabs, {
  type CompareTab,
} from "@/components/marketing/CompareTabs";
import SectionHeading from "@/components/marketing/SectionHeading";
import WhyCards from "@/components/marketing/WhyCards";
import PhoneMock from "@/components/marketing/PhoneMock";

/*  Hero */

export function HomeHero() {
  return (
    <section className="mk-container pb-20 pt-10 lg:pb-28 lg:pt-16">
      <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Reveal onMount index={0}>
            <p className="inline-flex items-center gap-2 rounded-full bg-[var(--mk-surface)] py-1.5 pe-3.5 ps-2.5 text-[0.875rem] font-[540] shadow-[var(--mk-shadow-border)]">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[var(--mk-signal)]"
              />
              Verified hosts in Lagos and Abuja
            </p>
          </Reveal>
          <Reveal onMount index={1} as="h1" className="mk-display max-w-[13ch]">
            {BRAND.tagline}
          </Reveal>
          <Reveal onMount index={2}>
            <p className="mk-lead">
              Shortlets, hotels and guesthouses from hosts we have verified.
              Your payment is held until your stay is done, and every booking
              leaves a record.
            </p>
          </Reveal>
          <Reveal onMount index={3} className="pt-2">
            <HeroSearch />
          </Reveal>
          <Reveal onMount index={4}>
            <p className="text-[0.9375rem] text-[var(--mk-muted)]">
              Own a property?{" "}
              <Link to="/hosts" className="mk-link text-[var(--mk-ink)]">
                List it with us
              </Link>
            </p>
          </Reveal>
        </div>

        {/* The one orchestrated moment on the page: the record plays once. */}
        <Reveal
          onMount
          index={2}
          className="mx-auto w-full max-w-[400px] pt-4 lg:mx-0 lg:justify-self-end"
        >
          <KeyTag
            autoplay
            reference="Booking KH-20418"
            title="Two-bed apartment, Lekki"
            steps={SAMPLE_RECORD}
            footer={{ label: "Held until checkout", value: "₦340,000" }}
          />
        </Reveal>
      </div>
    </section>
  );
}

/* - Network (also About flow) */

export const NETWORK_STEPS: StepItem[] = [
  {
    id: "hosts",
    label: "Hosts",
    title: "Verified before they list.",
    body: "Every host proves who they are before a listing goes live. No anonymous accounts, no listings from people who do not control the property.",
    facts: [
      "Identity checked at sign-up",
      "Two-factor sign-in for host accounts",
      "One host, one record, across every property",
    ],
    proof: "A name behind every listing",
    visual: <CityMapVisual />,
  },
  {
    id: "escrow",
    label: "Escrow",
    title: "Your money waits for you.",
    body: "You pay through Paystack or Flutterwave and the money is held. The host can see it, but it is released only when your stay completes.",
    facts: [
      "Paid upfront, held in escrow",
      "Refunds follow the policy shown before you book",
      "Released to the host automatically at checkout",
    ],
    proof: "Nobody is paid for a stay that did not happen",
    visual: <EscrowVisual />,
  },
  {
    id: "record",
    label: "Record",
    title: "From request to checkout.",
    body: "Every booking keeps a timestamped record: requested, paid, checked in, checked out, paid out. If anything is disputed, there is something to show.",
    facts: [
      "Every status change is logged with a time",
      "Shared between you and the host",
      "Notifications by email, SMS and in the app",
    ],
    proof: "A record at every step",
    visual: (
      <KeyTag
        reference="Booking KH-20418"
        title="Two-bed apartment, Lekki"
        steps={SAMPLE_RECORD}
        completed={SAMPLE_RECORD.length}
        footer={{ label: "Released to host", value: "₦340,000" }}
      />
    ),
  },
];

export function NetworkSection() {
  return (
    <section
      className="mk-section bg-[var(--mk-surface)]"
      aria-labelledby="network-heading"
    >
      <div className="mk-container">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <Reveal as="h2" className="mk-h2 max-w-[14ch]">
            <span id="network-heading">The listing is the easy part.</span>
          </Reveal>
          <Reveal index={1}>
            <p className="mk-lead">
              Anyone can post photos of an apartment. What makes a stay worth
              booking is everything around it: hosts who are verified, money
              that is held safely, and a record of every booking.
            </p>
          </Reveal>
        </div>

        <div className="mt-8 lg:mt-4">
          <StickySteps steps={NETWORK_STEPS} />
        </div>

        <Reveal className="mt-16 flex flex-col items-start justify-between gap-6 rounded-[24px] bg-[var(--mk-paper)] p-8 sm:flex-row sm:items-center lg:mt-24">
          <p className="max-w-[40ch] text-[1.375rem] font-[600] leading-snug tracking-[-0.02em]">
            Every host is verified and answers to us. Not a marketplace of
            strangers.
          </p>
          <Link to="/trust" className="mk-btn mk-btn-ghost shrink-0">
            How we verify hosts
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/*  Listing */

export const LISTING_SPOTS: Hotspot[] = [
  {
    id: "power",
    x: 77,
    y: 28,
    title: "Power backup",
    body: "Inverter, generator or both, and how many hours it covers. Stated on the listing.",
  },
  {
    id: "water",
    x: 86,
    y: 74,
    title: "Running water",
    body: "Borehole or mains, and whether there is a tank. No surprises in the shower.",
  },
  {
    id: "security",
    x: 8,
    y: 50,
    title: "Security",
    body: "Gatehouse, guards or estate access rules, so you know how you get in at night.",
  },
  {
    id: "wifi",
    x: 56,
    y: 27,
    title: "Internet",
    body: "Provider and plan, not just a Wi-Fi icon.",
  },
  {
    id: "photos",
    x: 18,
    y: 25,
    title: "Recent photos",
    body: "Every room you can book is shown, including the bathroom.",
  },
  {
    id: "checkin",
    x: 56,
    y: 75,
    title: "Check-in details",
    body: "Times, who meets you, and the turnover window between guests.",
  },
];

export function ListingSection() {
  return (
    <section className="mk-section" aria-labelledby="listing-heading">
      <div className="mk-container grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div className="flex flex-col gap-5">
          <Reveal>
            <p className="mk-kicker">The listing</p>
          </Reveal>
          <Reveal index={1} as="h2" className="mk-h2 max-w-[13ch]">
            <span id="listing-heading">
              Every listing answers the real questions.
            </span>
          </Reveal>
          <Reveal index={2}>
            <p className="mk-lead">
              Photos sell an apartment. The questions you actually ask before
              booking in Lagos are about power, water, security and getting in.
              A listing does not go live until it answers them.
            </p>
          </Reveal>
          <Reveal index={3}>
            <Link to="/stays" className="mk-link">
              What every listing has to show
            </Link>
          </Reveal>
        </div>
        <Reveal index={1}>
          <FloorPlanHotspots spots={LISTING_SPOTS} />
        </Reveal>
      </div>
    </section>
  );
}

/* Escrow */

export const ESCROW_TABS: CompareTab[] = [
  {
    id: "direct",
    label: "Paying a host directly",
    rows: [
      {
        title: "Before you arrive",
        body: "The money has left your account and sits with someone you have never met.",
        verdictLabel: "Your risk",
        verdict: "All of it",
        tone: "bad",
      },
      {
        title: "If it is not as listed",
        body: "You negotiate a refund from a host who has already been paid.",
        verdictLabel: "Leverage",
        verdict: "None",
        tone: "bad",
      },
      {
        title: "If something is disputed",
        body: "Screenshots of a chat thread are the only record.",
        verdictLabel: "Proof",
        verdict: "Your word",
        tone: "bad",
      },
    ],
  },
  {
    id: "escrow",
    label: `Paying through ${BRAND.name}`,
    rows: [
      {
        title: "Before you arrive",
        body: "The money is held in escrow. The host can see it but cannot withdraw it.",
        verdictLabel: "Your risk",
        verdict: "Held",
        tone: "good",
      },
      {
        title: "If it is not as listed",
        body: "The host has not been paid. Refunds follow the policy you saw before booking.",
        verdictLabel: "Leverage",
        verdict: "Yours",
        tone: "good",
      },
      {
        title: "If something is disputed",
        body: "Every step of the booking is on a timestamped record.",
        verdictLabel: "Proof",
        verdict: "On record",
        tone: "good",
      },
    ],
  },
];

export function EscrowSection() {
  return (
    <section
      className="mk-section bg-[var(--mk-lagoon-tint)]"
      aria-labelledby="escrow-heading"
    >
      <div className="mk-container">
        <SectionHeading
          id="escrow-heading"
          kicker="Why escrow"
          title="Paid upfront. Released at checkout."
          lead="You pay when you book, like anywhere else. The difference is where the money waits, and who it waits for."
        />
        <CompareTabs tabs={ESCROW_TABS} />
      </div>
    </section>
  );
}

/* - Why it matters */

export function WhySection() {
  return (
    <section className="mk-section" aria-labelledby="why-heading">
      <div className="mk-container">
        <SectionHeading
          id="why-heading"
          kicker="Why it matters"
          title="Fewer surprises. Nothing to chase."
          lead="Three things you notice on your first booking, whether you are the guest, the host or the person who recommended the place."
        />
        <WhyCards />
      </div>
    </section>
  );
}

/* - App */

export function AppSection() {
  return (
    <section
      className="mk-section bg-[var(--mk-surface)]"
      aria-labelledby="app-heading"
    >
      <div className="mk-container grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Reveal className="order-2 lg:order-1">
          <PhoneMock />
        </Reveal>
        <div className="order-1 flex flex-col gap-5 lg:order-2">
          <Reveal>
            <p className="mk-kicker">The app</p>
          </Reveal>
          <Reveal index={1} as="h2" className="mk-h2 max-w-[14ch]">
            <span id="app-heading">One app, from search to checkout.</span>
          </Reveal>
          <Reveal index={2}>
            <p className="mk-lead">
              Book it, see where your money is, message the host, and keep the
              details of the stay in one place. Nothing lives in a screenshot.
            </p>
          </Reveal>
          <Reveal index={3} className="flex flex-wrap gap-3 pt-2">
            <a href={BRAND.appLinks.ios} className="mk-btn mk-btn-primary">
              <Apple size={18} strokeWidth={1.75} aria-hidden="true" />
              App Store
            </a>
            <a href={BRAND.appLinks.android} className="mk-btn mk-btn-ghost">
              <Smartphone size={18} strokeWidth={1.75} aria-hidden="true" />
              Google Play
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* Hosts */

export function HostsBand() {
  return (
    <section className="mk-section" aria-labelledby="hosts-band-heading">
      <div className="mk-container grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
        <div className="flex flex-col gap-5">
          <Reveal>
            <p className="mk-kicker">For hosts</p>
          </Reveal>
          <Reveal index={1} as="h2" className="mk-h2 max-w-[16ch]">
            <span id="hosts-band-heading">
              Running shortlets should not be a second job.
            </span>
          </Reveal>
        </div>
        <Reveal index={2} className="flex flex-col items-start gap-6">
          <p className="mk-lead">
            Double bookings, payout chasing and staff with the wrong access cost
            you more than any fee. We give you your own booking page, one
            calendar for every unit, roles for your team, and payouts that
            arrive without you asking.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/hosts" className="mk-btn mk-btn-primary">
              See how hosting works
            </Link>
            <a
              href={`mailto:${BRAND.hostsEmail}`}
              className="mk-btn mk-btn-ghost"
            >
              {BRAND.hostsEmail}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
