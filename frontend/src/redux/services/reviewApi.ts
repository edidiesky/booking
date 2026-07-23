import { apiSlice }   from "./apiSlice";
import { REVIEW_URL } from "@/constants/api";
import type {
  RoomTypeReviewsResponse, CreateReviewPayload, CreateReviewResponse,
  ApiSuccessResponse,
} from "@/types/api";

interface RoomTypeReviewsParams {
  roomTypeId: string;
  rating?:    number;
  verified?:  boolean;
  page?:      number;
  limit?:     number;
}

export const reviewApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Public, no auth required, matches GET /reviews/room-types/:roomTypeId
    // being mounted with no authenticate/requireTenantMember gate.
    getRoomTypeReviews: builder.query<RoomTypeReviewsResponse, RoomTypeReviewsParams>({
      query: ({ roomTypeId, rating, verified, page = 1, limit = 10 }) => {
        const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (rating != null) qs.set("rating", String(rating));
        if (verified != null) qs.set("verified", String(verified));
        return { url: `${REVIEW_URL}/room-types/${roomTypeId}?${qs.toString()}` };
      },
      providesTags: (_r, _e, { roomTypeId }) => [{ type: "Review", id: roomTypeId }],
    }),

    createReview: builder.mutation<CreateReviewResponse, CreateReviewPayload>({
      query: (body) => ({ url: REVIEW_URL, method: "POST", body }),
      invalidatesTags: (_r, _e, { bookingId }) => [{ type: "Review", id: "LIST" }, { type: "Review", id: bookingId }],
    }),

    respondToReview: builder.mutation<ApiSuccessResponse, { reviewId: string; text: string }>({
      query: ({ reviewId, text }) => ({ url: `${REVIEW_URL}/${reviewId}/respond`, method: "POST", body: { text } }),
      invalidatesTags: ["Review"],
    }),

    markReviewHelpful: builder.mutation<ApiSuccessResponse, { reviewId: string; helpful: boolean }>({
      query: ({ reviewId, helpful }) => ({ url: `${REVIEW_URL}/${reviewId}/helpful`, method: "POST", body: { helpful } }),
      invalidatesTags: ["Review"],
    }),
  }),
});

export const {
  useGetRoomTypeReviewsQuery,
  useCreateReviewMutation,
  useRespondToReviewMutation,
  useMarkReviewHelpfulMutation,
} = reviewApi;