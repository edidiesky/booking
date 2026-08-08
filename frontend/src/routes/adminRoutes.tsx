import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { AdminOnlyRoute } from "./guards/AdminOnlyRoute";
import PageLoader from "@/components/common/PageLoader";

const AdminLayout = lazy(() => import("@/screens/admin/layout"));
const AdminOverview = lazy(() => import("@/screens/admin/Home"));
const AdminTenants = lazy(() => import("@/screens/admin/Tenants"));
const AdminCustomers = lazy(() => import("@/screens/admin/Customers"));
const AdminAdministrators = lazy(
  () => import("@/screens/admin/Administrators"),
);
const AdminAuditLogs = lazy(() => import("@/screens/admin/AuditLogs"));
const AdminBookings = lazy(() => import("@/screens/admin/Bookings"));
const AdminProperties = lazy(() => import("@/screens/admin/Properties"));
const AdminPayments = lazy(() => import("@/screens/admin/Payment"));
const AdminCalendar = lazy(() => import("@/screens/admin/Calendar"));
const AdminNotifications = lazy(() => import("@/screens/admin/Notifications"));
const AdminRoles = lazy(() => import("@/screens/admin/Roles"));

const wrap = (el: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>
    <>{el}</>
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
      { index: true, element: wrap(<AdminOverview />) },
      { path: "tenants", element: wrap(<AdminTenants />) },
      { path: "customers", element: wrap(<AdminCustomers />) },
      { path: "administrators", element: wrap(<AdminAdministrators />) },
      { path: "audit-logs", element: wrap(<AdminAuditLogs />) },
      { path: "properties", element: wrap(<AdminProperties />) },
      { path: "bookings", element: wrap(<AdminBookings />) },
      { path: "payments", element: wrap(<AdminPayments />) },
      { path: "calendar", element: wrap(<AdminCalendar />) },
      { path: "notifications", element: wrap(<AdminNotifications />) },
      { path: "roles", element: wrap(<AdminRoles />) },
    ],
  },
];
