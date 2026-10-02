import MarketingLayout from "@/components/marketing/MarketingLayout";
import PrivacyPolicyTab from "@/screens/dashboard/account/tabs/PrivacyPolicyTab";
import TermsTab from "@/screens/dashboard/account/tabs/TermsTab";

/**
 * Public legal pages. Renders the same content the account settings already
 * show, so there is one source. That content is a placeholder in the codebase
 * today: replace it with reviewed legal text before launch.
 */
export default function LegalPage({ doc }: { doc: "privacy" | "terms" }) {
  const title = doc === "privacy" ? "Privacy policy" : "Terms of service";
  return (
    <MarketingLayout title={title}>
      <section className="mk-container py-16 lg:py-24">
        <h1 className="mk-h2">{title}</h1>
        <div className="mt-10 max-w-[68ch] text-[1rem] leading-relaxed [&_*]:!text-[1rem] [&_p]:!text-[var(--mk-muted)]">
          {doc === "privacy" ? <PrivacyPolicyTab /> : <TermsTab />}
        </div>
      </section>
    </MarketingLayout>
  );
}
