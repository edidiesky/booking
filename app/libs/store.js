import { configureStore } from "@reduxjs/toolkit";
import favouritesSlice from "./features/favourites/favouritesSlice";
import modalSlice from "./features/modals/modalSlice";
import roomSlice from "./features/rooms/roomSlice";

export const Store = () => {
  return configureStore({
    reducer: {
      favourites: favouritesSlice,
      modals: modalSlice,
      room: roomSlice
    },
  });
};
