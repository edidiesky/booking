import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { reviewService } from "../../../domains/review/review.service";
import { reviewRepository } from "../../../domains/review/review.repository";
import { bookingRepository } from "../../../domains/booking/booking.repository";
import { expectAppError } from "../../helpers/expectAppError";

jest.mock("../../../domains/review/review.repository");
jest.mock("../../../domains/booking/booking.repository");
jest.mock("../../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn() },
}));

const mockedReviewRepo = reviewRepository as jest.Mocked<
  typeof reviewRepository
>;
const mockedBookingRepo = bookingRepository as jest.Mocked<
  typeof bookingRepository
>;

describe("reviewService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects when booking not found", async () => {
    mockedBookingRepo.findById.mockResolvedValue(null as never);
    await expectAppError(
      reviewService.createReview({
        bookingId: "missing",
        guestUserId: "guest-1",
        rating: 5,
        comment: "Great",
      } as never),
      404,
    );
  });

  it("rejects when booking not checked_out", async () => {
    mockedBookingRepo.findById.mockResolvedValue({
      id: "booking-1",
      status: "confirmed",
      guest_user_id: "guest-1",
    } as never);
    await expectAppError(
      reviewService.createReview({
        bookingId: "booking-1",
        guestUserId: "guest-1",
        rating: 5,
        comment: "Great",
      } as never),
      409,
    );
  });

  it("rejects when not booking guest", async () => {
    mockedBookingRepo.findById.mockResolvedValue({
      id: "booking-1",
      status: "checked_out",
      guest_user_id: "guest-1",
    } as never);
    await expectAppError(
      reviewService.createReview({
        bookingId: "booking-1",
        guestUserId: "other",
        rating: 5,
        comment: "Great",
      } as never),
      403,
    );
  });

  it("creates review after checkout for guest", async () => {
    mockedBookingRepo.findById.mockResolvedValue({
      id: "booking-1",
      status: "checked_out",
      guest_user_id: "guest-1",
      property_id: "prop-1",
      tenant_id: "tenant-1",
    } as never);
    mockedReviewRepo.findById?.mockResolvedValue?.(null as never);
    mockedReviewRepo.create.mockResolvedValue({
      id: "rev-1",
      rating: 5,
      comment: "Great",
    } as never);
    const result = await reviewService.createReview({
      bookingId: "booking-1",
      guestUserId: "guest-1",
      rating: 5,
      comment: "Great",
    } as never);
    expect(result).toMatchObject({ rating: 5 });
  });
});
