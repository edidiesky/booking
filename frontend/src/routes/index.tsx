import { createBrowserRouter } from "react-router-dom";
import { authRoutes }          from "./authRoutes";
import { guestRoutes }         from "./guestRoutes";
// import { dashboardRoutes }     from "./dashboardRoutes";
// import { adminRoutes }         from "./adminRoutes";

export const router = createBrowserRouter([
  ...guestRoutes,
  ...authRoutes,
  // ...dashboardRoutes,
  // ...adminRoutes,
]);