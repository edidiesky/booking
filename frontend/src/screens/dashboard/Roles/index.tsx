import { useState } from "react";
import { motion } from "framer-motion";
import { Users, ShieldCheck } from "lucide-react";
import TeamManagementTab from "./tabs/TeamManagementTab";
import RolesPermissionsTab from "./tabs/RolesPermissionsTab";

type TopTab = "team" | "rolesPermissions";

const TOP_TABS: { key: TopTab; label: string; icon: typeof Users }[] = [
  { key: "team",             label: "Team Management",   icon: Users },
  { key: "rolesPermissions", label: "Roles & Permissions", icon: ShieldCheck },
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
      <div className="flex items-center gap-2 border-b" style={{ borderColor: "#e8e6e3" }}>
        {TOP_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-3 text-xs lg:text-[13px]  relative -mb-px"
              style={{
                color: active ? "var(--color-ink)" : "var(--color-muted-stone)",
                borderBottom: active ? "2px solid var(--color-ink)" : "2px solid transparent",
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "team" ? <TeamManagementTab /> : <RolesPermissionsTab />}
    </motion.div>
  );
}