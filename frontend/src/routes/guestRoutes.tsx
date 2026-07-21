import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import PageLoader from "@/components/common/PageLoader";

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
    path: "*",
    element: (
      <Suspense fallback={<></>}>
        <NotFound />
      </Suspense>
    ),
  },
  { path: "/booking-success/:bookingId?", element: s(<BookingSuccess />) },
];
