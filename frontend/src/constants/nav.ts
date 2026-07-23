import {
  User, Settings2, FileText, BadgeCheck, ShieldCheck, KeyRound,
  Fingerprint, Flag, Lock, HelpCircle, Headphones, ScrollText, FileLock2,
} from "lucide-react";
import type { SettingsNavGroup } from "@/components/dashboard/common/SettingsLayout";

export const ACCOUNT_SETTINGS_NAV: SettingsNavGroup[] = [
  {
    title: "Profile",
    items: [
      { key: "profile",      label: "Host Profile",        icon: User },
      { key: "tenant",       label: "Tenant Settings",      icon: Settings2 },
      { key: "policy",       label: "Cancellation Policy",  icon: FileText },
      { key: "verification", label: "Account Verification", icon: BadgeCheck },
    ],
  },
  {
    title: "Security",
    items: [
      { key: "twoFactor",     label: "Two-Factor Authentication", icon: ShieldCheck },
      { key: "loginWithPin",  label: "Log in with PIN",           icon: Fingerprint },
      { key: "changePin",     label: "Change PIN",                icon: KeyRound },
      { key: "location",      label: "Change Location",           icon: Flag },
      { key: "passwordReset", label: "Password Reset",            icon: Lock },
    ],
  },
  {
    title: "Support",
    items: [
      { key: "faq",     label: "FAQs",                  icon: HelpCircle },
      { key: "contact", label: "Contact Us",            icon: Headphones },
      { key: "terms",   label: "Terms & Conditions",    icon: ScrollText },
      { key: "privacy", label: "Privacy Policy",        icon: FileLock2 },
    ],
  },
];

export const ACCOUNT_PANEL_TITLES: Record<string, string> = {
  profile:       "Profile",
  tenant:        "Tenant Settings",
  policy:        "Cancellation Policy",
  verification:  "Account Verification",
  twoFactor:     "Two-Factor Authentication",
  loginWithPin:  "Log in with PIN",
  changePin:     "Change PIN",
  location:      "Change Location",
  passwordReset: "Password Reset",
  faq:           "FAQs",
  contact:       "Contact Us",
  terms:         "Terms & Conditions",
  privacy:       "Privacy Policy",
};