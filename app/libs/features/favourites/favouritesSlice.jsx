"use client";
import { createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
const initialState = {
  savedRooms:  [],
};

export const favouritesSlice = createSlice({
  name: "favourites",
  initialState,
  reducers: {
    handleFavouritesRooms: (state, action) =>{}
  },
});

export const { handleFavouritesRooms } = favouritesSlice.actions;

export default favouritesSlice.reducer;
