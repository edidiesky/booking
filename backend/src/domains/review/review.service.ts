import { bookingRepository } from "../booking/booking.repository";
import { reviewRepository } from "./review.repository";
import {
  AppError,
  logger,
  requestContext,
} from "@booking/shared";

export const reviewService = {
  async createReview(input: {
    guestUserId: string;
    bookingId: string;
    rating: number;
    title: string;
    comment: string;
    images?: string[];
  }) {
    const booking = await bookingRepository.findById(input.bookingId);
    if (!booking) throw AppError.notFound("Booking not found.");
    if (booking.guest_user_id !== input.guestUserId) {
      throw AppError.forbidden("You can only review your own bookings.");
    }
    // Server-side eligibility check, never trust a client-supplied verified flag.
    if (booking.status !== "checked_out") {
      throw AppError.conflict("You can only review a stay after checking out.");
    }

    const alreadyReviewed = await reviewRepository.existsByBooking(
      input.bookingId,
      booking.room_type_id,
    );
    if (alreadyReviewed)
      throw AppError.conflict("You have already reviewed this stay.");

    if (input.rating < 1 || input.rating > 5)
      throw AppError.badRequest("Rating must be between 1 and 5.");

    const review = await reviewRepository.create({
      roomTypeId: booking.room_type_id,
      propertyId: booking.property_id,
      tenantId: booking.tenant_id,
      guestUserId: input.guestUserId,
      bookingId: input.bookingId,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      images: input.images,
      isVerifiedPurchase: true, // always true here, gated entirely by the checked_out check above
    });

    logger.info("review_submitted", {
      event: "review_submitted",
      reviewId: review.id,
      bookingId: input.bookingId,
      requestId: requestContext.get()?.requestId,
    });
    return review;
  },

  async getRoomTypeReviews(
    roomTypeId: string,
    filters: {
      rating?: number;
      verified?: boolean;
      page: number;
      limit: number;
    },
  ) {
    const [reviews, stats, totalCount] = await Promise.all([
      reviewRepository.findByRoomType(roomTypeId, filters),
      reviewRepository.getStats(roomTypeId),
      reviewRepository.countByRoomType(roomTypeId, {
        rating: filters.rating,
        verified: filters.verified,
      }),
    ]);
    return {
      reviews,
      stats,
      totalCount,
      page: filters.page,
      limit: filters.limit,
    };
  },

  async getTenantReviews(tenantId: string, page = 1, limit = 20) {
    return reviewRepository.findByTenant(tenantId, page, limit);
  },

  async getTenantReviewStats(tenantId: string) {
    return reviewRepository.getStatsForTenant(tenantId);
  },

  async respondToReview(reviewId: string, text: string, respondedBy: string) {
    const review = await reviewRepository.addResponse(
      reviewId,
      text,
      respondedBy,
    );
    if (!review) throw AppError.notFound("Review not found.");
    return review;
  },

  async markHelpful(reviewId: string, helpful: boolean) {
    const review = await reviewRepository.markHelpful(reviewId, helpful);
    if (!review) throw AppError.notFound("Review not found.");
    return review;
  },
};