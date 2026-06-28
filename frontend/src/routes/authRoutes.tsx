import { lazy, Suspense }   from "react";
import type { RouteObject } from "react-router-dom";
import { GuestOnlyRoute }   from "./guards/GuestOnlyRoute";
import PageLoader           from "@/components/common/PageLoader";

const Login          = lazy(() => import("@/screens/auth/login"));
const Onboarding     = lazy(() => import("@/screens/auth/onboarding"));
const SelectUserType = lazy(() => import("@/screens/auth/SelectUserType"));

const wrap = (el: React.ReactNode) => (
  <GuestOnlyRoute>
    <Suspense fallback={<PageLoader />}>{el}</Suspense>
  </GuestOnlyRoute>
);

export const authRoutes: RouteObject[] = [
  { path: "/login",            element: wrap(<Login />)          },
  { path: "/onboarding",       element: wrap(<Onboarding />)     },
  { path: "/select-user-type", element: wrap(<SelectUserType />) },
];