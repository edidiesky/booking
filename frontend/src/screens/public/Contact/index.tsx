import { Link } from "react-router-dom";
import { Building2, LifeBuoy, Mail } from "lucide-react";
import { BRAND } from "@/config/brand";
import MarketingLayout from "@/components/marketing/MarketingLayout";
import PageHero from "@/components/marketing/PageHero";
import LeadForm from "@/components/marketing/LeadForm";
import Reveal from "@/components/marketing/Reveal";

const CHANNELS = [
  {
    icon: LifeBuoy,
    title: "A problem with a booking",
    body: "Report it from the booking itself so the record and payout are attached. Include photos if you can.",
    action: { label: "Go to my trips", to: "/profile?tab=trips" },
  },
  {
    icon: Building2,
    title: "Hosting with us",
    body: "Setting up, importing rooms or connecting your own domain.",
    email: BRAND.hostsEmail,
  },
  {
    icon: Mail,
    title: "Everything else",
    body: "Press, partnerships, or a question this site did not answer.",
    email: BRAND.supportEmail,
  },
];

export default function ContactPage() {
  return (
    <MarketingLayout title="Contact" description={`Contact ${BRAND.name}: booking problems, hosting questions and everything else.`}>
      <PageHero
        kicker="Contact"
        title="Talk to a person."
        lead="Pick the route that fits. Booking problems go fastest from the booking itself, because the record comes with them."
      />

      <section className="mk-container pb-[clamp(4.5rem,3rem+6vw,8.5rem)]">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <ul className="flex flex-col">
            {CHANNELS.map((c, i) => (
              <Reveal as="li" index={i} key={c.title} className="flex gap-5 border-t border-[var(--mk-line)] py-7 first:border-t-0 first:pt-0">
                <c.icon size={24} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--mk-lagoon)]" aria-hidden="true" />
                <div className="flex flex-col gap-2">
                  <h2 className="text-[1.1875rem] font-[620] tracking-[-0.015em]">{c.title}</h2>
                  <p className="mk-body">{c.body}</p>
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="mk-link w-fit text-[var(--mk-ink)]">
                      {c.email}
                    </a>
                  )}
                  {c.action && (
                    <Link to={c.action.to} className="mk-link w-fit text-[var(--mk-ink)]">
                      {c.action.label}
                    </Link>
                  )}
                </div>
              </Reveal>
            ))}
          </ul>
          <Reveal index={1}>
            <LeadForm
              kind="contact"
              submitLabel="Send message"
              successTitle="Message sent."
              successBody="We will reply by email within one working day."
            />
          </Reveal>
        </div>
      </section>
    </MarketingLayout>
  );
}
