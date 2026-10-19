import {
  LuLayoutDashboard,
  LuBell,
  LuBuilding,
  LuCalendar,
  LuClipboardList,
  LuCreditCard,
  LuVault,
  LuUserRound,
  LuUsers,
  // LuShieldCheck,
  LuScrollText,
  // LuMessageSquare,
} from "react-icons/lu";
import type { NavGroup } from "@/types/ui";

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        icon: LuLayoutDashboard,
        text: "Dashboard",
        path: "",
        tour: "nav-dashboard",
      },
      // {
      //   icon: LuMessageSquare,
      //   text: "Messages",
      //   path: "messages",
      //   tour: "nav-messages",
      // },
      {
        icon: LuBell,
        text: "Notifications",
        path: "notifications",
        tour: "nav-notifications",
      },
    ],
  },
  {
    label: "Property",
    items: [
      {
        icon: LuBuilding,
        text: "Properties",
        path: "properties",
        tour: "nav-properties",
      },
      {
        icon: LuClipboardList,
        text: "Bookings",
        path: "bookings",
        tour: "nav-bookings",
      },
      {
        icon: LuCalendar,
        text: "Calendar",
        path: "calendar",
        tour: "nav-calendar",
      },
    ],
  },
  {
    label: "Money",
    items: [
      {
        icon: LuCreditCard,
        text: "Payments",
        path: "payments",
        tour: "nav-payments",
      },
      {
        icon: LuVault,
        text: "Escrow",
        path: "escrow",
        tour: "nav-escrow",
      },
    ],
  },
  {
    label: "Team",
    items: [
      {
        icon: LuUsers,
        text: "Roles",
        path: "roles",
        tour: "nav-roles",
      },
      // {
      //   icon: LuShieldCheck,
      //   text: "Permissions",
      //   path: "permissions",
      //   tour: "nav-permissions",
      // },
      {
        icon: LuScrollText,
        text: "Audit",
        path: "audit",
        tour: "nav-audit",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        icon: LuUserRound,
        text: "Settings",
        path: "account",
        tour: "nav-account",
      },
    ],
  },
];