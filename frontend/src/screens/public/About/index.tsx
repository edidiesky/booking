import { Link } from "react-router-dom";
import { BRAND } from "@/config/brand";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import PageHero from "@/components/marketing/PageHero";
import Reveal from "@/components/marketing/Reveal";
import StickySteps, { type StepItem } from "@/components/marketing/StickySteps";
import KeyTag, { SAMPLE_RECORD } from "@/components/marketing/KeyTag";
import ExploreIndex from "@/components/marketing/ExploreIndex";
import CtaBand from "@/components/marketing/CtaBand";
import { CityMapVisual, EscrowVisual, PayoutVisual } from "@/components/marketing/visuals";

const STAND_ON: StepItem[] = [
  {
    id: "verified",
    label: "Verified first",
    title: "A name behind every listing.",
    body: "We would rather have fewer listings than one we cannot stand behind. Hosts are verified before they publish, and that does not change as we grow.",
    proof: "Fewer listings, all real",
    visual: <CityMapVisual />,
  },
  {
    id: "held",
    label: "Money held",
    title: "Nobody is paid for a stay that did not happen.",
    body: "Paying a stranger upfront is the single biggest risk in short-term rentals here. Escrow removes it without asking guests to do anything differently.",
    proof: "Paid at booking, released at checkout",
    visual: <EscrowVisual />,
  },
  {
    id: "recorded",
    label: "On the record",
    title: "Facts, not screenshots.",
    body: "Disputes are settled by what happened, not by who argues longest. Every booking carries a timestamped record both sides can see.",
    proof: "A record at every step",
    visual: (
      <KeyTag
        reference="Booking KH-20418"
        title="Two-bed apartment, Lekki"
        steps={SAMPLE_RECORD}
        completed={SAMPLE_RECORD.length}
      />
    ),
  },
  {
    id: "hosts",
    label: "Hosts too",
    title: "Hosts are customers, not inventory.",
    body: "A good host who is paid on time, without chasing, stays on the platform and keeps their standards up. Their tools get the same care as the guest app.",
    proof: "Automatic payouts, real tools",
    visual: <PayoutVisual />,
  },
];

export default function AboutPage() {
  return (
    <MarketingLayout title="About" description={`Why we built ${BRAND.name} around verified hosts, held payments and a record of every booking.`}>
      <PageHero
        kicker="About"
        title="We built the part around the listing."
        lead={`${BRAND.name} is a booking platform for shortlets, hotels and guesthouses in Nigeria, built on three ideas: verify the host, hold the money, record every step.`}
      />

      <section className="mk-section bg-[var(--mk-surface)]" aria-labelledby="about-network">
        <div className="mk-container">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
            <Reveal as="h2" className="mk-h2 max-w-[14ch]">
              <span id="about-network">The listing is the easy part.</span>
            </Reveal>
            <Reveal index={1} className="flex flex-col gap-5">
              <p className="mk-lead">
                Photos of an apartment are cheap to post and easy to fake. Anyone who has booked a
                shortlet in Lagos knows the stories: the place that did not exist, the deposit that
                did not come back, the host who stopped answering.
              </p>
              <p className="mk-lead">
                None of that is fixed by better photos. It is fixed by what sits around the
                listing. That is what we build, and what we stand on.
              </p>
            </Reveal>
          </div>
          <div className="mt-8 lg:mt-4">
            <StickySteps steps={STAND_ON} />
          </div>
        </div>
      </section>

      <section className="mk-section" aria-labelledby="about-cities">
        <div className="mk-container grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <div className="flex flex-col gap-5">
            <p className="mk-kicker">Where we are</p>
            <h2 id="about-cities" className="mk-h2 max-w-[14ch]">
              City by city, host by host.
            </h2>
          </div>
          <div className="flex flex-col items-start gap-6">
            <p className="mk-lead">
              We open a city when there are enough verified hosts in it to be worth your search,
              not before. Live today:{" "}
              {BRAND.cities
                .filter((c) => c.live)
                .map((c) => c.name)
                .join(" and ")}
              .
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/hosts" className="mk-btn mk-btn-primary">
                Host in your city
              </Link>
              <Link to="/contact" className="mk-btn mk-btn-ghost">
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mk-section bg-[var(--mk-surface)]">
        <div className="mk-container">
          <ExploreIndex />
        </div>
      </section>

      <div className="pt-[clamp(4.5rem,3rem+6vw,8.5rem)]">
        <CtaBand
          title="See it for yourself."
          body="Search verified listings and book with the money on hold."
          primary={{ label: "Find a stay", to: "/search" }}
          secondary={{ label: "List your property", to: "/hosts" }}
        />
      </div>
    </MarketingLayout>
  );
}
