import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectCurrentUser, clearCredentials } from "@/redux/slices/authSlice";
import { useLogoutMutation } from "@/redux/services/authApi";
import { selectRefreshToken } from "@/redux/slices/authSlice";
import { apiSlice } from "@/redux/services/apiSlice";
import toast from "react-hot-toast";
import NavGroup from "@/components/dashboard/common/NavGroup";
import SidebarFooter from "@/components/dashboard/common/SidebarFooter";
import Header from "@/components/dashboard/common/Header";
import {
  LuLayoutDashboard,
  LuBuilding2,
  LuUsers,
  LuShieldCheck,
  LuScrollText,
  LuClipboardList,
  LuCreditCard,
  LuCalendar,
} from "react-icons/lu";

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

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const refreshToken = useSelector(selectRefreshToken);
  const [logout] = useLogoutMutation();

  const handleSignOut = async () => {
    try {
      if (refreshToken) await logout({ refreshToken }).unwrap();
    } catch {
      /*  */
    } finally {
      dispatch(apiSlice.util.resetApiState());
      dispatch(clearCredentials());
      navigate("/");
      toast.success("Signed out successfully.");
    }
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "var(--color-canvas)" }}
    >
      <aside
        className="hidden lg:flex flex-col w-[220px] h-screen shrink-0 border-r"
        style={{
          backgroundColor: "var(--color-canvas)",
          borderColor: "#ebebeb",
        }}
      >
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {ADMIN_NAV_GROUPS.map((group) => (
            <NavGroup key={group.label} group={group} />
          ))}
        </nav>
        <SidebarFooter currentUser={currentUser} onSignOut={handleSignOut} />
      </aside>

      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
