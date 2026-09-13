import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  ShieldCheck,
  Settings2,
  MonitorSmartphone,
  LifeBuoy,
  Globe,
} from "lucide-react";
import TeamManagementTab from "./tabs/TeamManagementTab";
import RolesPermissionsTab from "./tabs/RolesPermissionsTab";
import DomainSettingsTab from "./tabs/domain/DomainSettingsTab";
type TopTab = "general" | "team" | "roles" | "domain" | "sessions" | "support";

const TOP_TABS: {
  key: TopTab;
  label: string;
  icon: typeof Users;
}[] = [
  { key: "domain", label: "Domain", icon: Globe },
  { key: "general", label: "General", icon: Settings2 },
  { key: "team", label: "Team", icon: Users },
  { key: "roles", label: "Roles", icon: ShieldCheck },
  { key: "sessions", label: "Sessions", icon: MonitorSmartphone },
  { key: "support", label: "Support", icon: LifeBuoy },
];

export default function DashboardRoles() {
  const [activeTab, setActiveTab] = useState<TopTab>("team");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full p-6 lg:p-10 flex flex-col gap-6"
    >
      <div>
        <h1
          className="text-2xl lg:text-[28px] font-semibold tracking-tight"
          style={{ color: "var(--color-ink)" }}
        >
          Settings
        </h1>
      </div>

      <div
        className="flex items-center gap-1 border-b overflow-x-auto"
        style={{ borderColor: "#e8e6e3" }}
      >
        {TOP_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-3 text-xs lg:text-[13px] relative -mb-px whitespace-nowrap"
              style={{
                color: active ? "var(--color-ink)" : "var(--color-muted-stone)",
                borderBottom: active
                  ? "2px solid var(--color-ink)"
                  : "2px solid transparent",
                fontWeight: active ? 500 : 400,
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "team" && (
        <TeamManagementTab onManageRoles={() => setActiveTab("roles")} />
      )}

      {activeTab === "domain" && <DomainSettingsTab />}

      {activeTab === "roles" && <RolesPermissionsTab />}

      {activeTab === "general" && (
        <PlaceholderTab
          title="General"
          description="Workspace name, branding, and default preferences will live here."
        />
      )}
      {activeTab === "sessions" && (
        <PlaceholderTab
          title="Sessions"
          description="Active sessions and device management will live here."
        />
      )}
      {activeTab === "support" && (
        <PlaceholderTab
          title="Support"
          description="Support contacts and help resources will live here."
        />
      )}
    </motion.div>
  );
}

function PlaceholderTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="rounded-xl border px-6 py-12 text-center"
      style={{ borderColor: "#e8e6e3" }}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <ShieldCheck size={18} className="text-[#777b86]" />
        <h3 className="text-sm font-medium text-[#17191c]">{title}</h3>
      </div>
      <p className="text-xs lg:text-[13px] text-[#777b86] max-w-md mx-auto">
        {description}
      </p>
    </div>
  );
}