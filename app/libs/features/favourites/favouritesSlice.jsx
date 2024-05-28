import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  savedRooms:[]
};

export const favouritesSlice = createSlice({
  name: "favourites",
  initialState,
  reducers: {
    getBackgroundfavourites: (state, action) => {

    }
  },
});

export const {
  getBackgroundfavourites,
} = favouritesSlice.actions;

export default favouritesSlice.reducer;
