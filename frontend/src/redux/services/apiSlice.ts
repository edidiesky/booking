import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery:   baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "User",
    "Profile",
    "Tenant",
    "Property",
    "RoomType",
    "Availability",
    "Booking",
    "Payment",
    "Escrow",
    "Audit",
    "Notification",
    "Role",
    "Renter",
    "Permission",
    "Security",
    "Review",
  ],
  endpoints: () => ({}),
});