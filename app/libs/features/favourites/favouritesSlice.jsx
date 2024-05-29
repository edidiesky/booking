"use client";
import { createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { addListToWish } from "./favouritesReducer";
const initialState = {
  savedRooms: [],
  alertText: "",
  showAlert: false,
  alertType: "",
  wishisLoading: false,
  wishisSuccess: false,
  wishisError: false,
};

export const favouritesSlice = createSlice({
  name: "favourites",
  initialState,
  reducers: {
    handleFavouritesRooms: (state, action) => {},
  },
  extraReducers: (builder) => {
    builder.addCase(addListToWish.pending, (state, action) => {
      state.wishisLoading = true;
    });
    builder.addCase(addListToWish.fulfilled, (state, action) => {
      state.wishisSuccess = true;
      state.wishisLoading = false;
      toast.success(action.payload);
    });
    builder.addCase(addListToWish.rejected, (state, action) => {
      state.wishisSuccess = false;
      toast.error(action.payload);
    });
  },
});

export const { handleFavouritesRooms } = favouritesSlice.actions;

export default favouritesSlice.reducer;
