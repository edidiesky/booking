import { createSlice } from "@reduxjs/toolkit";
import {
  getAllReviews,
  getSingleReviewsDetails,
  CreateSingleReview,
  DeleteReview,
  UpdateReview,
} from "./reviewReducer";

const initialState = {
  // states
  reviewsIsSuccess: false,
  reviewsIsError: false,
  reviewsIsLoading: false,
  totalReviews: 0,

  ReviewsDetails: null,
  // alert states
  showAlert: false,
  alertText: "",
  alertType: "",
  review: [],
};

const ReviewsSlice = createSlice({
  name: "Review",
  initialState,
  reducers: {
    clearAlert: (state, action) => {
      state.showAlert = false;
      state.alertText = "";
      state.alertType = "";
    },
    getReviews: (state, action) => {
      state.deleteReviewModalAlert = true;
      state.ReviewsDetails = action.payload;
    },
    clearReviewsAlert: (state, action) => {
      state.showAlert = false;
      state.alertText = "";
      state.alertType = "";
      state.reviewsIsSuccess = false;
      state.reviewsIsError = false;
      state.reviewsIsLoading = false;
      state.search = "";
      state.ReviewsAlert = false;
    },
  },

  extraReducers: {
    //
    [getAllReviews.pending]: (state) => {
      state.reviewsIsLoading = true;
    },
    [getAllReviews.fulfilled]: (state, action) => {
      state.reviewsIsLoading = false;
      state.review = action.payload.review;
      state.showAlert = true;
      state.alertText = "All Reviews has been successfully fetched";
    },
    // reviews
    [getAllReviews.rejected]: (state, action) => {
      state.reviewsIsLoading = false;
      state.showAlert = true;
      state.reviewsIsError = true;
      state.alertText = action.payload;
      state.alertType = "danger";
    },
    // create reviews action handling
    [CreateSingleReview.pending]: (state) => {
      state.reviewsIsLoading = true;
    },
    [CreateSingleReview.fulfilled]: (state, action) => {
      state.reviewsIsLoading = false;
      state.ReviewsDetails = action.payload;
      state.reviewsIsSuccess = true;
      state.showAlert = true;
      state.alertText = `Succesfully created your review`;
      state.alertType = "success";
    },
    [CreateSingleReview.rejected]: (state, action) => {
      state.reviewsIsLoading = false;
      state.showAlert = true;
      state.reviewsIsError = true;
      state.alertText = action.payload;
      state.alertType = "danger";
    },

    // get single review details
    [getSingleReviewsDetails.pending]: (state) => {
      state.reviewsIsLoading = true;
    },
    [getSingleReviewsDetails.fulfilled]: (state, action) => {
      state.reviewsIsLoading = false;
      state.ReviewsDetails = action.payload;
    },
    [getSingleReviewsDetails.rejected]: (state, action) => {
      state.reviewsIsLoading = false;
      state.showAlert = true;
      state.reviewsIsError = true;
      state.alertText = action.payload;
      state.alertType = "danger";
    },

    // update the review
    [UpdateReview.pending]: (state) => {
      state.reviewsIsLoading = true;
    },
    [UpdateReview.fulfilled]: (state, action) => {
      state.reviewsIsLoading = false;
      state.reviewsIsSuccess = true;
      state.showAlert = true;
      state.alertText = "Reviews has been successfully updated";
    },
    [UpdateReview.rejected]: (state, action) => {
      state.reviewsIsLoading = false;
      state.showAlert = true;
      state.reviewsIsError = true;
      state.alertText = action.payload;
      state.alertType = "danger";
      state.showAlert = true;
    },

    // delete review
    [DeleteReview.pending]: (state) => {
      state.reviewsIsLoading = true;
    },
    [DeleteReview.fulfilled]: (state, action) => {
      state.reviewsIsLoading = false;
      state.Reviews = state.Reviews.filter((x) => x._id !== action.payload);
      state.showAlert = true;
      state.alertText = `${state.ReviewsDetails.title} has been successfully deleted`;
    },
    [DeleteReview.rejected]: (state, action) => {
      state.reviewsIsLoading = false;
      state.showAlert = true;
      state.reviewsIsError = true;
      state.alertText = action.payload;
      state.alertType = "danger";
      state.showAlert = true;
    },
  },
});

export const {
  clearAlert,
  getSort,
  getPage,
  clearReviewsAlert,
  getQuantity,
  handleCategoryFilter,
  clearReviewAction,
  clearPage,
  getSearch,
  getReviews,
  clearReviewsDetails,
  clearReviews,
} = ReviewsSlice.actions;

export default ReviewsSlice.reducer;
