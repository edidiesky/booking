import { useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/redux/slices/authSlice";
import AccountTab from "./tabs/AccountTab";
import TripsTab from "./tabs/TripsTab";
import SecurityTab from "./tabs/SecurityTab";
import NotificationsTab from "./tabs/NotificationsTab";
import { User } from "@/types/api";
import Header from "@/components/common/Header";

const TABS = [
  { key: "account", label: "Account", Component: AccountTab },
  { key: "trips", label: "Trips", Component: TripsTab },
  { key: "security", label: "Security", Component: SecurityTab },
  { key: "notifications", label: "Notifications", Component: NotificationsTab },
] as const;

export default function GuestProfile() {
  const [active, setActive] = useState<(typeof TABS)[number]["key"]>("account");
  const user = useSelector(selectCurrentUser);
  const ActiveComponent = TABS.find((t) => t.key === active)!.Component;
  const initial = user?.firstName?.charAt(0).toUpperCase() ?? "?";
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return (
    <div className="w-full flex flex-col gap-8">
      <Header />
      <div className="max-w-screen-2xl w-full lg:w-[90%] mx-auto lg:px-12 flex items-start justify-start flex-col gap-4">
        <div className="w-full flex items-center gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl lg:text-3xl bg-[rgb(255,224,195)]">
            {initial}
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-2xl font-semibold">{fullName} Settings</h4>
            <span className="text-xs lg:text-smcapitalize text-[#777b86] truncate">{`${user?.userType} profile`}</span>
          </div>
        </div>
        <div className="w-full gap-10">
          <div className="py-10 flex gap-8 lg:gap-8 items-start px-4">
            <div className="flex gap-2 flex-col items-start">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={`px-4 min-w-56 lg:min-w-48 text-start  hover:bg-[#f5f5f3] py-3 text-xs lg:text-sm${active === t.key ? "border-r-2 bg-[#f5f5f3] border-[#17191c] font-semibold" : "text-[#a3a6af]"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <ActiveComponent user={user as User} />
          </div>
        </div>
      </div>
    </div>
  );
}
