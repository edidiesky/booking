import { createSlice } from "@reduxjs/toolkit";
import {
  GetAllBuyerReservations,
  CreateBuyerReservations,
  DeleteBuyerReservations,
  UpdateBuyerReservations,
  GetSingleBuyerReservations,
  GetAllHostReservations,
} from "./reservationsReducer";
const initialState = {
  // states
  ReservationsIsSuccess: false,
  ReservationsIsError: false,
  ReservationsIsLoading: false,
  totalReservations: 0,
  Reservations: [],
  ReservationsDetails: null,
  ReservationsUpdateIsSuccess: false,
  ReservationsUpdateIsLoading: false,

  // alert states
  showAlert: false,
  alertText: "",
  alertType: "",

  errorMessage:"",
  errorAlert: false,
};

const ReservationsSlice = createSlice({
  name: "Reservations",
  initialState,
  reducers: {
    clearReservationsAlert: (state, action) => {
      state.showAlert = false;
      state.alertText = "";
      state.alertType = "";
      state.ReservationsIsSuccess = false;
      state.ReservationsIsError = false;
      state.ReservationsAlert = false;
      state.ReservationsUpdateIsSuccess = false;
    },
    clearReservations: (state, action) => {
      state.Reservations = null;
    },
    clearReservationsEroror: (state, action) => {
      state.errorMessage = "";
      state.errorAlert = false;
    },
  },

  extraReducers: {
    //
    [GetAllBuyerReservations.pending]: (state) => {
      state.ReservationsIsLoading = true;
    },
    [GetAllBuyerReservations.fulfilled]: (state, action) => {
      state.ReservationsIsLoading = false;
      state.Reservations = action.payload;
      state.showAlert = true;
      state.alertText = "All Reservations has been successfully fetched";
    },
    // Reservations
    [GetAllBuyerReservations.rejected]: (state, action) => {
      state.ReservationsIsLoading = false;
      state.showAlert = true;
      state.ReservationsIsError = true;
      state.alertText = action.payload;
      state.alertType = "danger";
    },

    // Get all host reservations
    [GetAllHostReservations.pending]: (state) => {
      state.ReservationsIsLoading = true;
    },
    [GetAllHostReservations.fulfilled]: (state, action) => {
      state.ReservationsIsLoading = false;
      state.Reservations = action.payload;
      state.showAlert = true;
      state.alertText = "All Reservations has been successfully fetched";
    },
    // Reservations
    [GetAllHostReservations.rejected]: (state, action) => {
      state.ReservationsIsLoading = false;
      state.showAlert = true;
      state.ReservationsIsError = true;
      state.alertText = action.payload;
      state.alertType = "danger";
    },
    [GetSingleBuyerReservations.pending]: (state) => {
      state.ReservationsIsLoading = true;
    },
    [GetSingleBuyerReservations.fulfilled]: (state, action) => {
      state.ReservationsIsLoading = false;
      state.ReservationsDetails = action.payload;
      state.alertText = "Your reservations has been successfully fetched";
      state.showAlert = true;
    },
    // Reservations
    [GetSingleBuyerReservations.rejected]: (state, action) => {
      state.ReservationsIsLoading = false;
      state.showAlert = true;
      state.ReservationsIsError = true;
      state.alertText = action.payload;
      state.alertType = "danger";
    },
    // create Reservations action handling
    [CreateBuyerReservations.pending]: (state) => {
      state.ReservationsIsLoading = true;
    },
    [CreateBuyerReservations.fulfilled]: (state, action) => {
      state.ReservationsIsLoading = false;
      state.ReservationsDetails = action.payload;
      state.ReservationsIsSuccess = true;
      state.showAlert = true;
      state.alertText = `Added successfully to Reservations`;
      state.alertType = "success";
    },
    [CreateBuyerReservations.rejected]: (state, action) => {
      state.ReservationsIsLoading = false;
      state.errorAlert = true;
      state.ReservationsIsError = true;
      state.errorMessage = action.payload;
      state.alertType = "danger";
    },

    // update the gig
    [UpdateBuyerReservations.pending]: (state) => {
      state.ReservationsUpdateIsLoading = true;
    },
    [UpdateBuyerReservations.fulfilled]: (state, action) => {
      state.ReservationsUpdateIsLoading = false;
      state.ReservationsUpdateIsSuccess = true;
      state.showAlert = true;
      state.alertText = "Your Reservations has been successfully updated";
    },
    [UpdateBuyerReservations.rejected]: (state, action) => {
      state.ReservationsUpdateIsLoading = false;
      state.showAlert = true;
      state.ReservationsIsError = true;
      state.alertText = action.payload;
      state.alertType = "danger";
      state.showAlert = true;
    },

    // delete gig
    [DeleteBuyerReservations.pending]: (state) => {
      state.ReservationsIsLoading = true;
    },
    [DeleteBuyerReservations.fulfilled]: (state, action) => {
      state.ReservationsIsLoading = false;
      state.Reservations = state.Reservations.filter(
        (x) => x._id !== action.payload
      );
      state.showAlert = true;
      state.alertText = `Successfully deleted`;
    },
    [DeleteBuyerReservations.rejected]: (state, action) => {
      state.ReservationsIsLoading = false;
      state.showAlert = true;
      state.ReservationsIsError = true;
      state.alertText = action.payload;
      state.alertType = "danger";
      state.showAlert = true;
    },
  },
});

export const { clearReservations, clearReservationsAlert, clearReservationsEroror } =
  ReservationsSlice.actions;

export default ReservationsSlice.reducer;
