import { useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import SettingsLayout from "@/components/dashboard/common/SettingsLayout";
import ProfileSection from "./ProfileSection";
import TenantSettingsSection from "./TenantSettingsSection";
import CancellationPolicySection from "./CancellationPolicySection";
import AccountVerificationTab from "./tabs/AccountVerificationTab";
import TwoFactorTab from "./tabs/TwoFactorTab";
import LoginWithPinTab from "./tabs/LoginWithPinTab";
import ChangePinTab from "./tabs/ChangePinTab";
import ChangeLocationTab from "./tabs/ChangeLocationTab";
import PasswordResetTab from "./tabs/PasswordResetTab";
import FaqTab from "./tabs/FaqTab";
import ContactUsTab from "./tabs/ContactUsTab";
import TermsTab from "./tabs/TermsTab";
import PrivacyPolicyTab from "./tabs/PrivacyPolicyTab";
import { useAccount } from "./hooks/useAccount";
import { selectCurrentUser } from "@/redux/slices/authSlice";
import { ACCOUNT_PANEL_TITLES, ACCOUNT_SETTINGS_NAV } from "@/constants/nav";

type PanelKey = keyof typeof ACCOUNT_PANEL_TITLES | "";

export default function DashboardAccount() {
  const currentUser = useSelector(selectCurrentUser);
  const [active, setActive] = useState<PanelKey>("profile");

  const {
    tenant, profile, isLoading,
    handleUpdateProfile,  savingProfile,
    handleUpdateSettings, savingSettings,
    handleUpdatePolicy,   savingPolicy,
  } = useAccount();

  if (isLoading) {
    return (
      <div className="w-full p-6 lg:p-10 flex flex-col gap-6">
        <div className="h-[70vh] rounded-2xl animate-pulse" style={{ backgroundColor: "#f2f0ed" }} />
      </div>
    );
  }

  const fullName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") || "Host";
  const hasPhone = Boolean(currentUser?.phone);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full flex flex-col gap-6"
    >
      <SettingsLayout
        headerName={fullName}
        headerSubtitle={currentUser?.email}
        activeKey={active || null}
        onSelect={(key) => setActive(key as PanelKey)}
        panelTitle={active ? ACCOUNT_PANEL_TITLES[active] : undefined}
        groups={ACCOUNT_SETTINGS_NAV}
      >
        {active === "profile" && (
          <ProfileSection profile={profile} onSave={handleUpdateProfile} isSaving={savingProfile} />
        )}
        {active === "tenant" && (
          <TenantSettingsSection tenant={tenant} onSave={handleUpdateSettings} isSaving={savingSettings} />
        )}
        {active === "policy" && (
          <CancellationPolicySection tenant={tenant} onSave={handleUpdatePolicy} isSaving={savingPolicy} />
        )}
        {active === "verification"  && <AccountVerificationTab hasPhone={hasPhone} />}
        {active === "twoFactor"     && <TwoFactorTab />}
        {active === "loginWithPin"  && <LoginWithPinTab />}
        {active === "changePin"     && <ChangePinTab />}
        {active === "location"      && <ChangeLocationTab />}
        {active === "passwordReset" && <PasswordResetTab />}
        {active === "faq"           && <FaqTab />}
        {active === "contact"       && <ContactUsTab />}
        {active === "terms"         && <TermsTab />}
        {active === "privacy"       && <PrivacyPolicyTab />}
      </SettingsLayout>
    </motion.div>
  );
}