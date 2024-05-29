import { configureStore } from "@reduxjs/toolkit";
import favouritesSlice from "./features/favourites/favouritesSlice";
import modalSlice from "./features/modals/modalSlice";

export const Store = () => {
  return configureStore({
    reducer: {
      favourites: favouritesSlice,
      modals: modalSlice
    },
  });
};
