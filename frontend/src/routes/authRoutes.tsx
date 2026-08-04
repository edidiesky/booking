import { lazy, Suspense }   from "react";
import type { RouteObject } from "react-router-dom";
import { GuestOnlyRoute }   from "./guards/GuestOnlyRoute";
import PageLoader           from "@/components/common/PageLoader";
const GoogleCallback = lazy(() => import("@/screens/auth/GoogleCallback"));
const Login          = lazy(() => import("@/screens/auth/login"));
const Onboarding     = lazy(() => import("@/screens/auth/onboarding"));
const ResetPassword  = lazy(() => import("@/screens/auth/ResetPassword"));
const NewPassword    = lazy(() => import("@/screens/auth/NewPassword"));

const wrap = (el: React.ReactNode) => (
  <GuestOnlyRoute>
    <Suspense fallback={<PageLoader />}>{el}</Suspense>
  </GuestOnlyRoute>
);

export const authRoutes: RouteObject[] = [
  { path: "/login",                    element: wrap(<Login />)          },
  { path: "/onboarding",                element: wrap(<Onboarding />)     },
  { path: "/reset-password",            element: wrap(<ResetPassword />)  },
  { path: "/reset-password/:token",     element: wrap(<NewPassword />)    },
  { path: "/oauth/google/callback", element: wrap(<GoogleCallback />) },
];