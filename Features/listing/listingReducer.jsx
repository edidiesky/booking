import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
// https://airbnb-api.vercel.app
// fetching all Gigs
export const getAllGigs = createAsyncThunk(
  "/fetch/allGigs",
  async (name, thunkAPI) => {
    try {
      const {
        page,
        search,
        sort,
        type,
        minprice,
        time,
        category,
        maxprice,
        endDate,
        startDate,
        location,
        listing_children,
        listing_adults,
        sellerId,
      } = thunkAPI.getState().gigs;
      const limit = listing_children + listing_adults;
      let GigsUrl = `${import.meta.env.VITE_API_BASE_URLS}/api/v1/listing`;
      if (sort) {
        productUrl = productUrl + `?sort=${sort}`;
      }
      if (sellerId) {
        GigsUrl = GigsUrl + `?listing_host_Id=${sellerId}`;
        const { data } = await axios.get(GigsUrl);
        return data;
      }
      if (type) {
        GigsUrl = GigsUrl + `?type=${type}`;
        const { data } = await axios.get(GigsUrl);
        return data;
      }
      if (
        location &&
        startDate === "Invalid date" &&
        endDate === "Invalid date" &&
        limit !== 0
      ) {
        GigsUrl = GigsUrl + `?listing_country=${location}`;
        const { data } = await axios.get(GigsUrl);
        return data;
      } else if (
        location &&
        startDate !== "Invalid date" &&
        endDate !== "Invalid date" &&
        limit !== 0
      ) {
        GigsUrl =
          GigsUrl +
          `?listing_endDate=${endDate}&listing_startDate=${startDate}&listing_country=${location}`;
        const { data } = await axios.get(GigsUrl);
        return data;
      } else if (
        location &&
        startDate !== "Invalid date" &&
        endDate !== "Invalid date" &&
        limit
      ) {
        console.log("All filled");
      } else if (
        !location &&
        startDate === "Invalid date" &&
        endDate === "Invalid date" &&
        limit
      ) {
        GigsUrl = GigsUrl + `?limit=${limit}`;
        const { data } = await axios.get(GigsUrl);
        return data;
      } else if (
        location ||
        limit ||
        (startDate === "Invalid date" && endDate === "Invalid date")
      ) {
        GigsUrl = GigsUrl + `?limit=${limit}&listing_country=${location}`;
        const { data } = await axios.get(GigsUrl);
        return data;
      }
      if (category || minprice || maxprice) {
        GigsUrl =
          GigsUrl +
          `?category=${category}&minprice=${minprice}&maxprice=${maxprice}`;
        const { data } = await axios.get(GigsUrl);
        return data;
      }
      if (page) {
        GigsUrl = GigsUrl + `?page=${page}`;
        const { data } = await axios.get(GigsUrl);
        return data;
      }
      const { data } = await axios.get(GigsUrl);
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

// fetching single Gigs based on its id
export const getSingleGigsDetails = createAsyncThunk(
  "Gigs/getGigsDetails",
  async (name, thunkAPI) => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URLS}/api/v1/listing/${name}`);

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

// fetching single Gigs based on its id
export const getHostListing = createAsyncThunk(
  "Gigs/getHostListing",
  async (name, thunkAPI) => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URLS}/api/v1/listing/host/${name}`);

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

// fetching single Gigs based on its id
export const CreateSingleGig = createAsyncThunk(
  "Gigs/createGigs",
  async (GigsData, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URLS}/api/v1/listing`, GigsData, config);

      return data.gig;
      // console.log(GigsData)
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Update a single Gigs for the admin
export const UpdateGig = createAsyncThunk(
  "/updateGig",
  async ({ GigsData }, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { _id } = state.gigs.GigsDetails;
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_BASE_URLS}/api/v1/listing/${_id}`,
        GigsData,
        config
      );
      // console.log(GigsData)
      return data.updatedGig;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Delete a single Gigs for the admin
export const DeleteGig = createAsyncThunk(
  "/admin/deleteGig",
  async (Gigsid, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.delete(`${import.meta.env.VITE_API_BASE_URLS}/api/v1/listing/${Gigsid}`, config);
      return Gigsid;
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
export const createReviewGigs = createAsyncThunk(
  "/user/reviewGigs/",
  async ({ Reviewdata, id }, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URLS}/api/v1/listing/review/${id}`,
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

// Get al toprated Gigs for the user
export const getTopRatedGigs = createAsyncThunk(
  "/get/topRatedGigs",
  async (name, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URLS}/api/v1/listing/rated`, config);
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

// Get al toprated Gigs for the user
export const getGigsStats = createAsyncThunk(
  "/get/getGigsStats",
  async (name, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URLS}/api/v1/listing/stats`, config);
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

// Get al toprated Gigs for the user
export const addListToWish = createAsyncThunk(
  "addListToWish",
  async (name, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.put(
        `${import.meta.env.VITE_API_BASE_URLS}/api/v1/listing/wish/${name}`,
        null,
        config
      );
      localStorage.setItem("customer", JSON.stringify(data.user));

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


export const getUserListingWishlist = createAsyncThunk(
  "getUserListingWishlist",
  async (name, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_BASE_URLS}/api/v1/listing/wish`,
        config
      );
      return data.listing;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);
