import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { HostOnlyRoute } from "./guards/HostOnlyRoute";
import { ProtectRoute } from "./guards/ProtectRoute";
import PageLoader from "@/components/common/PageLoader";

const DashboardLayout = lazy(() => import("@/screens/dashboard/layout"));
const DashboardHome = lazy(() => import("@/screens/dashboard/home"));
const DashboardProperties = lazy(
  () => import("@/screens/dashboard/Properties/index"),
);
const DashboardBookings = lazy(() => import("@/screens/dashboard/Bookings"));
const DashboardPayments = lazy(() => import("@/screens/dashboard/Payment"));
const DashboardEscrow = lazy(() => import("@/screens/dashboard/Escrow"));
const DashboardRoles = lazy(() => import("@/screens/dashboard/Roles"));
const DashboardCalendar = lazy(() => import("@/screens/dashboard/calendar"));
const DashboardAccount = lazy(() => import("@/screens/dashboard/account"));
const PropertyDetail = lazy(
  () => import("@/screens/dashboard/Properties/PropertyDetail"),
);
const DashboardRenters = lazy(() => import("@/screens/dashboard/Renters"));

const MyBookings = lazy(() => import("@/screens/guest/MyBookings"));
const BookingDetail = lazy(() => import("@/screens/guest/BookingDetail"));
const s = (el: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{el}</Suspense>
);

export const dashboardRoutes: RouteObject[] = [
  {
    path: "/dashboard",
    element: (
      <HostOnlyRoute>
        <Suspense fallback={<PageLoader />}>
          <DashboardLayout />
        </Suspense>
      </HostOnlyRoute>
    ),
    children: [
      { index: true, element: s(<DashboardHome />) },
      { path: "properties", element: s(<DashboardProperties />) },
      { path: "bookings", element: s(<DashboardBookings />) },
      { path: "payments", element: s(<DashboardPayments />) },
      { path: "escrow", element: s(<DashboardEscrow />) },
      { path: "roles", element: s(<DashboardRoles />) },
      { path: "calendar", element: s(<DashboardCalendar />) },
      { path: "account", element: s(<DashboardAccount />) },
      { path: "properties/:propertyId", element: s(<PropertyDetail />) },
      { path: "renters", element: s(<DashboardRenters />) },
    ],
  },
  {
    path: "/trips",
    element: (
      <ProtectRoute>
        <Suspense fallback={<PageLoader />}>{s(<MyBookings />)}</Suspense>
      </ProtectRoute>
    ),
  },
  {
    path: "/trips/:bookingId",
    element: (
      <ProtectRoute>
        <Suspense fallback={<PageLoader />}>{s(<BookingDetail />)}</Suspense>
      </ProtectRoute>
    ),
  },
];
