import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import { AdminOnlyRoute } from "./guards/AdminOnlyRoute";
import PageLoader from "@/components/common/PageLoader";

const AdminLayout    = lazy(() => import("@/screens/admin/layout"));
const AdminOverview  = lazy(() => import("@/screens/admin/Overview"));
const AdminTenants   = lazy(() => import("@/screens/admin/Tenants"));

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
      { index: true, element: <AdminOverview /> },
      { path: "tenants", element: <AdminTenants /> },
    ],
  },
];