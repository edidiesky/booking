"use client";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
export const addListToWish = createAsyncThunk(
  "addListToWish",
  async (name, thunkAPI) => {
    try {
      const { data } = await axios.post(`/api/favourites/${name}`);
      localStorage.setItem("client", JSON.stringify(data.user));

      return data.message;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);
