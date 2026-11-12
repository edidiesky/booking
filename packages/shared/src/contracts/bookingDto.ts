/** Shared API contract: booking resource as returned by booking-service */
export interface BookingDto {
  id: string;
  bookingId: string;
  tenantId: string;
  roomTypeId: string;
  guestUserId: string;
  checkIn: string;
  checkOut: string;
  roomsCount: number;
  totalAmountNgn: number;
  status: string;
  createdAt?: string;
}

export interface InitiatePaymentRequest {
  bookingId: string;
  guestUserId: string;
  email: string;
  gateway: "paystack" | "flutterwave";
  callbackUrl: string;
  tenantId: string;
  phone?: string;
}

export interface ReleaseEscrowRequest {
  bookingId: string;
  tenantId: string;
  totalAmountNgn: number;
  platformFeeNgn: number;
}
