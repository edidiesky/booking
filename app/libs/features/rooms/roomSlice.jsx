"use client";
import { createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { CreateRoom } from "./roomReducer";
const initialState = {
  savedRooms: [],
  alertText: "",
  showAlert: false,
  alertType: "",
  creatingRoomisLoading: false,
  creatingRoomisSuccess: false,
  creatingRoomisError: false,
};

export const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    handleroomRooms: (state, action) => {},
  },
  extraReducers: (builder) => {
    builder.addCase(CreateRoom.pending, (state, action) => {
      state.creatingRoomisLoading = true;
    });
    builder.addCase(CreateRoom.fulfilled, (state, action) => {
      state.creatingRoomisSuccess = true;
      state.creatingRoomisLoading = false;
      toast.success('Room has been created succesfully');
    });
    builder.addCase(CreateRoom.rejected, (state, action) => {
      state.creatingRoomisSuccess = false;
      toast.error(action.payload);
    });
  },
});

export const { handleroomRooms } = roomSlice.actions;

export default roomSlice.reducer;
