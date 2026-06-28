import { lazy, Suspense }   from "react";
import type { RouteObject } from "react-router-dom";
import { ProtectRoute }     from "./guards/ProtectRoute";
import PageLoader           from "@/components/common/PageLoader";

// Admin screens scaffolded but not yet implemented — placeholder
const AdminHome = lazy(() => import("@/screens/public/Landing"));

export const adminRoutes: RouteObject[] = [
  {
    path:    "/admin",
    element: (
      <ProtectRoute>
        <Suspense fallback={<PageLoader />}>
          <AdminHome />
        </Suspense>
      </ProtectRoute>
    ),
  },
];