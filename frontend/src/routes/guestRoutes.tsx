import { lazy, Suspense }   from "react";
import type { RouteObject } from "react-router-dom";
import PageLoader           from "@/components/common/PageLoader";

const Landing        = lazy(() => import("@/screens/public/Landing"));
const Properties     = lazy(() => import("@/screens/public/Properties"));
const PropertyDetail = lazy(() => import("@/screens/public/PropertyDetail"));

const s = (el: React.ReactNode) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

export const guestRoutes: RouteObject[] = [
  { path: "/",                    element: s(<Landing />)              },
  { path: "/properties",          element: s(<Properties />)           },
  { path: "/properties/:id",      element: s(<PropertyDetail />)       },
];