import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// fetching all Reviews
export const getAllReviews = createAsyncThunk(
  "/fetch/allReviews",
  async (name, thunkAPI) => {
    try {
      const { data } = await axios.get(`${process.env.VITE_API_BASE_URLS}/api/v1/review/${name}`);
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

// fetching single Reviews based on its id
export const getSingleReviewsDetails = createAsyncThunk(
  "Reviews/getReviewsDetails",
  async (name, thunkAPI) => {
    try {
      const { data } = await axios.get(`${process.env.VITE_API_BASE_URLS}/api/v1/review/${name}`);

      return data.gig;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// fetching single Reviews based on its id
export const CreateSingleReview = createAsyncThunk(
  "Reviews/createReviews",
  async (ReviewsData, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.post(`${process.env.VITE_API_BASE_URLS}/api/v1/review`, ReviewsData, config);

      return data.gig;
      // console.log(ReviewsData)
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Update a single Reviews for the admin
export const UpdateReview = createAsyncThunk(
  "/updateReview",
  async ({ReviewsData}, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { _id } = state.gigs.ReviewsDetails;
      const { data } = await axios.put(
        `${process.env.VITE_API_BASE_URLS}/api/v1/review/${_id}`,
        ReviewsData,
        config
      );
      // console.log(ReviewsData)
      return data.updatedReview;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Delete a single Reviews for the admin
export const DeleteReview = createAsyncThunk(
  "/admin/deleteReview",
  async (Reviewsid, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.delete(
        `${process.env.VITE_API_BASE_URLS}/api/v1/review/${Reviewsid}`,
        config
      );
      return Reviewsid;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Create a review access point for the user
export const createReviewReviews = createAsyncThunk(
  "/user/reviewReviews/",
  async ({ Reviewdata, id }, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.post(
        `${process.env.VITE_API_BASE_URLS}/api/v1/review/review/${id}`,
        Reviewdata,
        config
      );
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

// Get al toprated Reviews for the user
export const getTopRatedReviews = createAsyncThunk(
  "/get/topRatedReviews",
  async (name, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.get(`${process.env.VITE_API_BASE_URLS}/api/v1/review/rated`, config);
      return data.toprated;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Get al toprated Reviews for the user
export const getReviewsStats = createAsyncThunk(
  "/get/getReviewsStats",
  async (name, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.get(`${process.env.VITE_API_BASE_URLS}/api/v1/review/stats`, config);
      return data.stats;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);
