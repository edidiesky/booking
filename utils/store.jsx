import { configureStore } from "@reduxjs/toolkit";
import userSlice from "@/Features/user/userSlice";
import wishSlice from "@/Features/wish/wishSlice";
import listingSlice from "@/Features/listing/listingSlice";
import orderSlice from "@/Features/order/orderSlice";
import reviewSlice from "@/Features/reviews/reviewSlice";
import reservationSlice from "@/Features/reservations/reservationsSlice";
export const store = configureStore({
  reducer: {
    user: userSlice,
    wish: wishSlice,
    gigs: listingSlice,
    order: orderSlice,
    reservations: reservationSlice,
    review: reviewSlice,
  },
});
