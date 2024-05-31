"use client";
import { createSlice } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { CreateRoom, GetAllRooms, DeleteRoom } from "./roomReducer";
const initialState = {
  rooms: [],
  alertText: "",
  showAlert: false,
  alertType: "",
  creatingRoomisLoading: false,
  creatingRoomisSuccess: false,
  creatingRoomisError: false,

  getallRoomisLoading: false,
  getallRoomisSuccess: false,
  getallRoomisError: false,

  deleteRoomisLoading: false,
  deleteRoomisSuccess: false,
  deleteRoomisError: false,
};

export const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    handleClearRoomAlert: (state, action) => {
      state.creatingRoomisSuccess = false;
      state.deleteRoomisSuccess = false;
      state.creatingRoomisSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(CreateRoom.pending, (state, action) => {
      state.creatingRoomisLoading = true;
    });
    builder.addCase(CreateRoom.fulfilled, (state, action) => {
      state.creatingRoomisSuccess = true;
      state.creatingRoomisLoading = false;
      toast.success("Room has been created succesfully");
    });
    builder.addCase(CreateRoom.rejected, (state, action) => {
      state.creatingRoomisSuccess = false;
      toast.error(action.payload);
    });

    builder.addCase(GetAllRooms.pending, (state, action) => {
      state.getallRoomisLoading = true;
    });
    builder.addCase(GetAllRooms.fulfilled, (state, action) => {
      state.getallRoomisSuccess = true;
      state.getallRoomisLoading = false;
      state.rooms = action.payload;
    });
    builder.addCase(GetAllRooms.rejected, (state, action) => {
      state.getallRoomisSuccess = false;
      toast.error(action.payload);
    });

    builder.addCase(DeleteRoom.pending, (state, action) => {
      state.deleteRoomisLoading = true;
    });
    builder.addCase(DeleteRoom.fulfilled, (state, action) => {
      state.deleteRoomisSuccess = true;
      state.deleteRoomisLoading = false;
      state.rooms = state.rooms.filter((room) => room.id !== action.payload);
      toast.success("Room has been deleted");
    });
    builder.addCase(DeleteRoom.rejected, (state, action) => {
      state.deleteRoomisSuccess = false;
      toast.error(action.payload);
    });
  },
});

export const { handleClearRoomAlert } = roomSlice.actions;

export default roomSlice.reducer;
