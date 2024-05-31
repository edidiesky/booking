"use client";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const CreateRoom = createAsyncThunk(
  "CreateRoom",
  async (roomdata, thunkAPI) => {
    try {
      const { data } = await axios.post(`/api/rooms`, roomdata);

      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);
