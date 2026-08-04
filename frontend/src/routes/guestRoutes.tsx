import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import PageLoader from "@/components/common/PageLoader";
import { ProtectRoute } from "./guards/ProtectRoute";
const GuestProfile = lazy(() => import("@/screens/guest/Profile"));
const GuestFavorites = lazy(() => import("@/screens/guest/MyFavorites"));
const Landing = lazy(() => import("@/screens/public/Landing"));
const Properties = lazy(() => import("@/screens/public/Properties"));
const SearchPage = lazy(() => import("@/screens/public/Search"));
const PropertyDetail = lazy(() => import("@/screens/public/PropertyDetail"));
const NotFound = lazy(() => import("@/screens/NotFound"));
const Unauthorized = lazy(() => import("@/screens/Unauthorized"));
const BookingSuccess  = lazy(() => import("@/screens/guest/BookingSuccess"));
const s = (el: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{el}</Suspense>
);

export const guestRoutes: RouteObject[] = [
  { path: "/", element: s(<Landing />) },
  { path: "/properties", element: s(<Properties />) },
  { path: "/favorites", element: s(<GuestFavorites />) },
  { path: "/properties/:id", element: s(<PropertyDetail />) },
  { path: "/search", element: s(<SearchPage />) },
  {
    path: "/unauthorized",
    element: (
      <Suspense fallback={<></>}>
        <Unauthorized />
      </Suspense>
    ),
  },
  {
      path: "/profile",
      element: (
        <ProtectRoute>
          <Suspense fallback={<PageLoader />}>{s(<GuestProfile />)}</Suspense>
        </ProtectRoute>
      ),
    },
  {
    path: "*",
    element: (
      <Suspense fallback={<></>}>
        <NotFound />
      </Suspense>
    ),
  },
  { path: "/booking-success/:bookingId?", element: s(<BookingSuccess />) },
];
