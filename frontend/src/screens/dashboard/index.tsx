import { lazy } from "react";
const DashboardHome       = lazy(() => import("@/screens/dashboard/home"));       
const DashboardAnalytics  = lazy(() => import("@/screens/dashboard/analytics"));  
const DashboardBookings   = lazy(() => import("@/screens/dashboard/Bookings"));  
const DashboardPayments   = lazy(() => import("@/screens/dashboard/Payment"));   
const DashboardEscrow     = lazy(() => import("@/screens/dashboard/Escrow"));    
const DashboardProperties = lazy(() => import("@/screens/dashboard/Properties"));
const DashboardRoles      = lazy(() => import("@/screens/dashboard/Roles"));     
const DashboardAccount    = lazy(() => import("@/screens/dashboard/account"));    
export {
  DashboardHome,
  DashboardAnalytics,
  DashboardBookings,
  DashboardEscrow,
  DashboardPayments,
  DashboardProperties,
  DashboardRoles,
  DashboardAccount,
};