import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import PageLoader from "@/components/common/PageLoader";
import { ProtectRoute } from "./guards/ProtectRoute";
import RootRouteGate from "@/screens/public/RootRouteGate";
const GuestProfile = lazy(() => import("@/screens/guest/Profile"));
const GuestFavorites = lazy(() => import("@/screens/guest/MyFavorites"));
const Properties = lazy(() => import("@/screens/public/Properties"));
const SearchPage = lazy(() => import("@/screens/public/Search"));
const PropertyDetail = lazy(() => import("@/screens/public/PropertyDetail"));
const NotFound = lazy(() => import("@/screens/NotFound"));
const Unauthorized = lazy(() => import("@/screens/Unauthorized"));
const BookingSuccess  = lazy(() => import("@/screens/guest/BookingSuccess"));
const StaysPage = lazy(() => import("@/screens/public/Stays"));
const HostsPage = lazy(() => import("@/screens/public/Hosts"));
const TrustPage = lazy(() => import("@/screens/public/Trust"));
const HowItWorksPage = lazy(() => import("@/screens/public/HowItWorks"));
const AboutPage = lazy(() => import("@/screens/public/About"));
const ContactPage = lazy(() => import("@/screens/public/Contact"));
const LegalPage = lazy(() => import("@/screens/public/Legal"));
const s = (el: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{el}</Suspense>
);

export const guestRoutes: RouteObject[] = [
  { path: "/", element: <RootRouteGate /> },
  { path: "/properties", element: s(<Properties />) },
  { path: "/favorites", element: s(<GuestFavorites />) },
  { path: "/properties/:id", element: s(<PropertyDetail />) },
  { path: "/search", element: s(<SearchPage />) },
  { path: "/stays", element: s(<StaysPage />) },
  { path: "/hosts", element: s(<HostsPage />) },
  { path: "/trust", element: s(<TrustPage />) },
  { path: "/how-it-works", element: s(<HowItWorksPage />) },
  { path: "/about", element: s(<AboutPage />) },
  { path: "/contact", element: s(<ContactPage />) },
  { path: "/privacy", element: s(<LegalPage doc="privacy" />) },
  { path: "/terms", element: s(<LegalPage doc="terms" />) },
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