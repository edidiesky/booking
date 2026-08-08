import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuBuilding2,
  LuUsers,
  LuShieldCheck,
  LuScrollText,
  LuClipboardList,
  LuCreditCard,
  LuCalendar,
  LuBell,
  LuVault,
  // LuShield
} from "react-icons/lu";
import { selectCurrentUser, clearCredentials } from "@/redux/slices/authSlice";
import { useLogoutMutation } from "@/redux/services/authApi";
import { selectRefreshToken } from "@/redux/slices/authSlice";
import toast from "react-hot-toast";
import NavGroup from "./NavGroup";
import SidebarFooter from "./SidebarFooter";
import { apiSlice } from "@/redux/services/apiSlice";

const ADMIN_NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      {
        icon: LuLayoutDashboard,
        text: "Overview",
        path: "",
        tour: "admin-overview",
      },
      {
        icon: LuBell,
        text: "Notifications",
        path: "notifications",
        tour: "admin-notifications",
      },
      // { icon: LuShield, text: "Roles", path: "roles", tour: "admin-roles" },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        icon: LuBuilding2,
        text: "Sellers / Tenants",
        path: "tenants",
        tour: "admin-tenants",
      },
      {
        icon: LuUsers,
        text: "Customers / Guests",
        path: "customers",
        tour: "admin-customers",
      },
      {
        icon: LuShieldCheck,
        text: "Administrators",
        path: "administrators",
        tour: "admin-administrators",
      },
    ],
  },
  {
    label: "Marketplace",
    items: [
      {
        icon: LuBuilding2,
        text: "Properties",
        path: "properties",
        tour: "admin-properties",
      },
      {
        icon: LuClipboardList,
        text: "Bookings",
        path: "bookings",
        tour: "admin-bookings",
      },
      {
        icon: LuCreditCard,
        text: "Payments",
        path: "payments",
        tour: "admin-payments",
      },
      {
        icon: LuCalendar,
        text: "Calendar",
        path: "calendar",
        tour: "admin-calendar",
      },
      // admin/layout.tsx, Marketplace group
      { icon: LuVault, text: "Escrow", path: "escrow", tour: "admin-escrow" },
    ],
  },
  {
    label: "Compliance",
    items: [
      {
        icon: LuScrollText,
        text: "Audit Logs",
        path: "audit-logs",
        tour: "admin-audit-logs",
      },
    ],
  },
];

export default function AdminSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const refreshToken = useSelector(selectRefreshToken);
  const [logout] = useLogoutMutation();

  const handleSignOut = async () => {
    try {
      if (refreshToken) await logout({ refreshToken }).unwrap();
    } catch {
      /* */
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
        {ADMIN_NAV_GROUPS.map((group) => (
          <NavGroup key={group.label} group={group} base="/admin" />
        ))}
      </nav>

      <SidebarFooter currentUser={currentUser} onSignOut={handleSignOut} />
    </aside>
  );
}
