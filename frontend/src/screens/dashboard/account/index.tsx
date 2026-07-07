import { motion }                    from "framer-motion";
import Title                         from "@/components/dashboard/common/Title";
import ProfileSection                from "./ProfileSection";
import TenantSettingsSection         from "./TenantSettingsSection";
import { useAccount }                from "./hooks/useAccount";
import CancellationPolicySection from "./CancellationPolicySection";

function Section({ title, description, children }: {
  title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 p-6 border rounded-2xl"
         style={{ borderColor: "#e8e6e3" }}>
      <div className="flex flex-col gap-1 pb-4 border-b" style={{ borderColor: "#f2f0ed" }}>
        <h3 className="text-sm bold" style={{ color: "var(--color-ink)" }}>{title}</h3>
        <p className="text-xs" style={{ color: "var(--color-light-steel)" }}>{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function DashboardAccount() {
  const {
    tenant, profile, isLoading,
    handleUpdateProfile,  savingProfile,
    handleUpdateSettings, savingSettings,
    handleUpdatePolicy,   savingPolicy,
  } = useAccount();

  if (isLoading) {
    return (
      <div className="w-full p-6 lg:p-10 flex flex-col gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-6"
    >
      <Title title="Account" description="Manage your host profile, tenant settings, and cancellation policy." />

      <Section title="Profile" description="Your public host name and bio.">
        <ProfileSection profile={profile} onSave={handleUpdateProfile} isSaving={savingProfile} />
      </Section>

      <Section title="Tenant Settings" description="Timezone, currency, and locale for your property.">
        <TenantSettingsSection tenant={tenant} onSave={handleUpdateSettings} isSaving={savingSettings} />
      </Section>

      <Section title="Cancellation Policy" description="Define refund tiers based on hours before check-in.">
        <CancellationPolicySection tenant={tenant} onSave={handleUpdatePolicy} isSaving={savingPolicy} />
      </Section>
    </motion.div>
  );
}