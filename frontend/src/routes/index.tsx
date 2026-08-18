import { createBrowserRouter, ScrollRestoration, Outlet } from "react-router-dom";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { authRoutes }      from "./authRoutes";
import { guestRoutes }     from "./guestRoutes";
import { dashboardRoutes } from "./dashboardRoutes";
import { adminRoutes }     from "./adminRoutes";

function RootLayout() {
  useScrollToTop();
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [...guestRoutes, ...authRoutes, ...dashboardRoutes, ...adminRoutes],
  },
]);