import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// fetching all reservations for the seller and admin
export const GetAllBuyerReservations = createAsyncThunk(
  "reservations/allBuyerReservations",
  async (id, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      let ReservationsUrl = `${process.env.VITE_API_BASE_URLS}/api/v1/reservations`;
      const { data } = await axios.get(ReservationsUrl, config);
      return data.reservations;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// fetching all host resrevation
export const GetAllHostReservations = createAsyncThunk(
  "reservations/GetAllHostReservations",
  async (id, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      let ReservationsUrl = `${process.env.VITE_API_BASE_URLS}/api/v1/reservations/host`;
      const { data } = await axios.get(ReservationsUrl, config);
      return data.reservations;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);


// fetching all reservations for the buyer
export const GetSingleBuyerReservations = createAsyncThunk(
  "reservations/singleBuyerReservations",
  async (name, thunkAPI) => {
    const state = thunkAPI.getState();
    const config = {
      headers: {
        authorization: `Bearer ${state.user.token}`,
      },
    };
    try {
      let ReservationsUrl = `${process.env.VITE_API_BASE_URLS}/api/v1/reservations/buyer/${name}`;
      const { data } = await axios.get(ReservationsUrl, config);
      return data.reservations;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);
// fetching single reservations based on its id
export const CreateBuyerReservations = createAsyncThunk(
  "Reservations/createBuyerReservations",
  async (reservationdata, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      // console.log(reservationdata)
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.post(
        `${process.env.VITE_API_BASE_URLS}/api/v1/reservations/${state.gigs.GigsDetails._id}`,
        reservationdata,
        config
      );

      return data.reservations;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Update a single Reservations
export const UpdateBuyerReservations = createAsyncThunk(
  "reservations/updateBuyerReservations",
  async (GigsData, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { _id } = state.reservations.ReservationsDetails;
      const { data } = await axios.put(
        `${process.env.VITE_API_BASE_URLS}/api/v1/reservations/${_id}`,
        GigsData,
        config
      );
      return data.updatedGigs;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Delete a single reservations
export const DeleteBuyerReservations = createAsyncThunk(
  "reservations/deleteGig",
  async (Reservationsid, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.delete(
        `${process.env.VITE_API_BASE_URLS}/api/v1/reservations/${Reservationsid}`,
        config
      );
      return Reservationsid;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Get al toprated reservations
export const GetTopRatedBuyerReservations = createAsyncThunk(
  "/get/getGigsStats",
  async (name, thunkAPI) => {
    const state = thunkAPI.getState();
    try {
      const config = {
        headers: {
          authorization: `Bearer ${state.user.token}`,
        },
      };
      const { data } = await axios.get(`${process.env.VITE_API_BASE_URLS}/api/v1/gig/stats`, config);
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
