import { useDispatch, useSelector }          from "react-redux";
import {  useNavigate }        from "react-router-dom";
import {
  LuLayoutDashboard, LuBell, LuBuilding, LuCalendar, LuClipboardList,
  LuCreditCard, LuVault, LuUserRound, LuUsers, LuShieldCheck, LuHistory,
} from "react-icons/lu";
import { selectCurrentUser, clearCredentials } from "@/redux/slices/authSlice";
import { useLogoutMutation }                 from "@/redux/services/authApi";
import { selectRefreshToken }                from "@/redux/slices/authSlice";
import toast                                 from "react-hot-toast";
import NavGroup                              from "./NavGroup";
import SidebarFooter                         from "./SidebarFooter";
import { apiSlice } from "@/redux/services/apiSlice";

export const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { icon: LuLayoutDashboard, text: "Dashboard",      path: "",              tour: "nav-dashboard"     },
      { icon: LuBell,            text: "Notifications",  path: "notifications", tour: "nav-notifications" },
    ],
  },
  {
    label: "Property",
    items: [
      { icon: LuBuilding,        text: "Properties", path: "properties", tour: "nav-properties" },
      { icon: LuClipboardList,   text: "Bookings",   path: "bookings",   tour: "nav-bookings"   },
      { icon: LuCalendar,        text: "Calendar",   path: "calendar",   tour: "nav-calendar"   },
      { icon: LuUserRound,       text: "Tenants",    path: "renters",    tour: "nav-renters"    },
    ],
  },
  {
    label: "Finance",
    items: [
      { icon: LuCreditCard, text: "Payments", path: "payments", tour: "nav-payments" },
      { icon: LuVault,      text: "Escrow",   path: "escrow",   tour: "nav-escrow"   },
    ],
  },
  {
    label: "Team",
    items: [
      { icon: LuUsers,       text: "Roles",    path: "roles",    tour: "nav-roles"    },
      { icon: LuHistory,     text: "Activity", path: "activity", tour: "nav-activity" },
      { icon: LuShieldCheck, text: "Account",  path: "account",  tour: "nav-account"  },
    ],
  },
];

export default function Sidebar() {
  const dispatch      = useDispatch();
  const navigate      = useNavigate();
  const currentUser   = useSelector(selectCurrentUser);
  const refreshToken  = useSelector(selectRefreshToken);
  const [logout]      = useLogoutMutation();

const handleSignOut = async () => {
  try {
    if (refreshToken) await logout({ refreshToken }).unwrap();
  } catch {
    /* proceed with local cleanup regardless of API outcome */
  } finally {
    dispatch(apiSlice.util.resetApiState());
    dispatch(clearCredentials());
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/");
    toast.success("Signed out successfully.");
  }
};

  return (
    <aside
      className="hidden lg:flex flex-col w-[220px] h-screen shrink-0 border-r"
      style={{ backgroundColor: "var(--color-canvas)", borderColor: "#ebebeb" }}
    >
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map((group) => (
          <NavGroup key={group.label} group={group} />
        ))}
      </nav>

      <SidebarFooter currentUser={currentUser} onSignOut={handleSignOut} />
    </aside>
  );
}