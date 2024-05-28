import { configureStore } from "@reduxjs/toolkit";
import favouritesSlice from "./features/favourites/favouritesSlice";

export const Store = () => {
  return configureStore({
    reducer: {
        favourites:favouritesSlice
    },
  });
};
