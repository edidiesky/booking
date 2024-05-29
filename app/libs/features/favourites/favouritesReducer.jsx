import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const addListToWish = createAsyncThunk(
  "addListToWish",
  async (name, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const { data } = await axios.put(`/api/v1/listing/wish/${name}`);
      localStorage.setItem("client", JSON.stringify(data));

      return data.msg;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);
