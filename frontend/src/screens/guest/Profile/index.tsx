import { useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/redux/slices/authSlice";
import AccountTab from "./tabs/AccountTab";
import TripsTab from "./tabs/TripsTab";
import SecurityTab from "./tabs/SecurityTab";
import NotificationsTab from "./tabs/NotificationsTab";
import { User } from "@/types/api";

const TABS = [
  { key: "account", label: "Account", Component: AccountTab },
  { key: "trips", label: "Trips", Component: TripsTab },
  { key: "security", label: "Security", Component: SecurityTab },
  { key: "notifications", label: "Notifications", Component: NotificationsTab },
] as const;

export default function GuestProfile() {
  const [active, setActive] = useState<typeof TABS[number]["key"]>("account");
  const user = useSelector(selectCurrentUser);
  const ActiveComponent = TABS.find((t) => t.key === active)!.Component;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex gap-2 border-b border-[#e8e6e3] mb-6">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActive(t.key)}
            className={`px-4 py-2 text-xs ${active === t.key ? "border-b-2 border-[#17191c] text-[#17191c] font-semibold" : "text-[#a3a6af]"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <ActiveComponent user={user as User} />
    </div>
  );
}