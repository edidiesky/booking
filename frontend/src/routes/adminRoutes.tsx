import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { AdminOnlyRoute } from "./guards/AdminOnlyRoute";
import PageLoader from "@/components/common/PageLoader";
import PageTransition from "@/components/common/PageTransition";

const AdminLayout        = lazy(() => import("@/screens/admin/layout"));
const AdminOverview      = lazy(() => import("@/screens/admin/Overview"));
const AdminTenants       = lazy(() => import("@/screens/admin/Tenants"));
const AdminCustomers     = lazy(() => import("@/screens/admin/Customers"));
const AdminAdministrators = lazy(() => import("@/screens/admin/Administrators"));
const AdminAuditLogs     = lazy(() => import("@/screens/admin/AuditLogs"));
const AdminBookings     = lazy(() => import("@/screens/admin/Bookings"));
const AdminProperties     = lazy(() => import("@/screens/admin/Properties"));
const AdminPayments     = lazy(() => import("@/screens/admin/Payment"));
const AdminCalendar     = lazy(() => import("@/screens/admin/Customers"));

const wrap = (el: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>
    <PageTransition>{el}</PageTransition>
  </Suspense>
);

export const adminRoutes: RouteObject[] = [
  {
    path: "/admin",
    element: (
      <AdminOnlyRoute>
        <Suspense fallback={<PageLoader />}>
          <AdminLayout />
        </Suspense>
      </AdminOnlyRoute>
    ),
    children: [
      { index: true,               element: wrap(<AdminOverview />) },
      { path: "tenants",           element: wrap(<AdminTenants />) },
      { path: "customers",         element: wrap(<AdminCustomers />) },
      { path: "administrators",    element: wrap(<AdminAdministrators />) },
      { path: "audit-logs",        element: wrap(<AdminAuditLogs />) },
      { path: "properties", element: wrap(<AdminProperties />) },
      { path: "bookings",   element: wrap(<AdminBookings />) },
      { path: "payments",   element: wrap(<AdminPayments />) },
      { path: "calendar",   element: wrap(<AdminCalendar />) },
    ],
  },
];