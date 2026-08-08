//  Shared 

export interface ApiSuccessResponse {
  success: boolean;
  message: string;
}

export interface PaginationMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data:    T[];
  meta:    PaginationMeta;
}

//  Auth 

export interface AuthTokens {
  success: boolean;
  message: string;
  data: {
    accessToken:  string;
    refreshToken: string;
    user: {
      id:        string;
      email:     string;
      firstName: string;
      lastName:  string;
      userType:  string;
      tenantId:  string | null;
    };
  };
}

export type UserType =
  | "guest"
  | "host:admin"
  | "host:staff"
  | "host:inspector"
  | "platform:admin";

export interface User {
  id:               string;
  email:            string;
  firstName:        string;
  lastName:         string;
  userType:         UserType;
  tenantId?:        string;
  phone?:           string;
  profileImage?:    string;
  status:           "draft" | "active" | "inactive" | "suspended";
  isEmailVerified:  boolean;
  lastActiveAt?:    string;
  createdAt:        string;
  googleId: string;
}

export interface InitiateOnboardingPayload {
  email:    string;
  password: string;
}

export interface InitiateOnboardingResponse {
  success: boolean;
  message: string;
  debug?:  string;        // OTP returned in dev mode only
}

export interface ConfirmEmailPayload {
  email: string;
  token: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface RegisterGuestPayload {
  email:     string;
  firstName: string;
  lastName:  string;
  phone?:    string;
}

export interface RegisterHostPayload {
  email:           string;
  firstName:       string;
  lastName:        string;
  phone?:          string;
  tenantName:      string;
  tenantSlug:      string;
  platformFeePct?: number;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

export interface LogoutPayload {
  refreshToken: string;
}

//  Profile 

export interface Profile {
  userId:       string;
  displayName:  string;
  bio?:         string;
  avatarUrl?:   string;
  address?: {
    city?:    string;
    state?:   string;
    country?: string;
  };
  updatedAt: string;
}

export interface UpdateProfilePayload {
  displayName?: string;
  bio?:         string;
  avatarUrl?:   string;
  address?: {
    city?:    string;
    state?:   string;
    country?: string;
  };
}

//  Tenant 

export interface TenantSettings {
  timezone: string;
  currency: string;
  locale:   string;
}

export interface CancellationPolicyTier {
  hours_before: number;
  refund_pct:   number;
}

export interface Tenant {
  id:                  string;
  slug:                string;
  name:                string;
  ownerUserId:         string;
  platformFeePct:      number;
  status:              "draft" | "active" | "suspended";
  settings:            TenantSettings;
  cancellationPolicy:  CancellationPolicyTier[];
  createdAt:           string;
  updatedAt:           string;
}

export interface UpdateTenantSettingsPayload {
  timezone?: string;
  currency?: string;
  locale?:   string;
}

export interface UpdateCancellationPolicyPayload {
  policy: CancellationPolicyTier[];
}

//  Property 

export type PropertyType   = "shortlet" | "hotel" | "guesthouse";
export type PropertyStatus = "draft" | "active" | "paused" | "archived";

export interface PropertyAddress {
  street:  string;
  city:    string;
  state:   string;
  country: string;
  lat?:    number;
  lng?:    number;
}

// src/types/api.ts
export interface Property {
  id:            string;
  tenantId:      string;
  name:          string;
  description:   string;
  propertyType:  PropertyType;
  status:        PropertyStatus;
  address:       PropertyAddress;
  amenities:     string[];
  images:        string[];
  checkInTime:   string;
  checkOutTime:  string;
  roomTypes:     RoomType[];   // add this
  createdAt:     string;
  updatedAt:     string;
  property_type?:string
  room_sort_mode?: "alphabetical" | "price" | "rating" | "newest" | "oldest" | "custom";
  gantt_max_visible_rooms?: number;
  latitude?:     number | null;
  longitude?:    number | null;
}
export interface CreatePropertyPayload {
  name:          string;
  description:   string;
  propertyType:  PropertyType;
  address:       PropertyAddress;
  amenities?:    string[];
  images?:       string[];
  checkInTime?:  string;
  checkOutTime?: string;
  latitude?:     number;
  longitude?:    number;
}



export interface CreateRoomTypePayload {
  name:          string;
  description?:  string;
  maxOccupancy:  number;
  basePriceNgn:  number;
  quantity:      number;
  amenities?:    string[];
  images?:       string[];
  status?:       RoomStatus;
}
//  Room Type 

export type RoomStatus = "active" | "inactive";

export interface RoomType {
  id:              string;
  propertyId:      string;
  tenantId:        string;
  name:            string;
  description:     string;
  maxOccupancy:    number;
  base_price_ngn:    number;
  quantity:        number;
  status:          RoomStatus;
  amenities:       string[];
  createdAt:       string;
  updatedAt:       string;
  images?:       string[];
}



export interface UpdatePropertyPayload {
  name?:         string;
  description?:  string;
  status?:       PropertyStatus;
  amenities?:    string[];
  images?:       string[];
  checkInTime?:  string;
  checkOutTime?: string;
}


export interface SeedCalendarPayload {
  startDate: string;
  endDate:   string;
}

export interface AvailabilitySlot {
  date:              string;
  room_type_id:      string;
  available_count:   number;
  is_blocked:        boolean;
  price_override_ngn?: number;
}

export interface BlockDatesPayload {
  startDate: string;
  endDate:   string;
  block:     boolean;
}

//  Booking 

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "refunded";

export interface BookingStats {
  confirmedCount:  number;
  checkedInCount:  number;
  checkedOutCount: number;
  cancelledCount:  number;
  pendingCount:    number;
  currentMonthRevenueNgn:  number;
  previousMonthRevenueNgn: number;
  revenueGrowthPct: number;
}

export interface BookingStatsResponse {
  success: boolean;
  data:    BookingStats;
}

export interface Booking {
  bookingId:        string;
  bookingRef:       string;
  status:           BookingStatus;
  guestUserId:      string;
  checkIn:          string;
  checkOut:         string;
  nights:           number;
  roomsCount:       number;
  guestCount:       number;
  totalAmountNgn:   number;
  platformFeeNgn:   number;
  hostPayoutNgn:    number;
  propertyId:       string;
  roomTypeId:       string;
  tenantId:         string;
  sessionId:        string;
  specialRequests?: string;
  createdAt:        string;
  receiptUrl?:string;
  room_type_images: string[];
  propertyName?:  string;
  propertyCity?:  string;
  roomTypeName?:  string;
  roomTypeQuantity?: number;
  roomTypeImage?: string;
  guestFirstName?: string;
  guestLastName?:  string;
  tenant_name?:string
}


export interface InitiateBookingPayload {
  propertyId:       string;
  roomTypeId:       string;
  checkIn:          string;
  checkOut:         string;
  roomsCount:       number;
  guestCount:       number;
  specialRequests?: string;
}

export interface InitiateBookingResponse {
  success:   boolean;
  data: {
    bookingId:  string;
    bookingRef: string;
    sessionId:  string;
    status:     BookingStatus;
    totalAmountNgn: number;
  };
}

export interface CancelBookingPayload {
  reason?: string;
}

export interface BookingListResponse {
  success: boolean;
  data:    Booking[];
}

export interface TenantBookingQueryParams {
  status?: BookingStatus;
  page?:   number;
  limit?:  number;
}

//  Payment 

export type PaymentStatus  = "pending" | "success" | "failed" | "refunded";
export type PaymentGateway = "paystack" | "flutterwave";
export interface PaymentStats {
  successCount:  number;
  failedCount:   number;
  pendingCount:  number;
  refundedCount: number;
  currentMonthVolumeNgn:  number;
  previousMonthVolumeNgn: number;
  volumeGrowthPct: number;
}

export interface PaymentStatsResponse {
  success: boolean;
  data:    PaymentStats;
}

export interface PropertyStats {
  activeCount:   number;
  draftCount:    number;
  pausedCount:   number;
  archivedCount: number;
  currentMonthNewListings:  number;
  previousMonthNewListings: number;
  newListingsGrowthPct: number;
}

export interface PropertyStatsResponse {
  success: boolean;
  data:    PropertyStats;
}

export interface PaymentSummary {
  id:                   string;
  booking_id:           string;
  gateway:              PaymentGateway;
  transaction_id:       string | null;
  amount_ngn:           string;
  status:               PaymentStatus;
  channel:              string | null;
  paid_at:              string | null;
  created_at:           string;
  booking_ref:          string;
  check_in:             string;
  check_out:            string;
  receipt_url:          string | null;
  guest_first_name:     string;
  guest_last_name:      string;
  guest_profile_image:  string | null;
  room_type_name:       string;
  room_type_images:     string[];
  guest_email:          string;
  guest_user_type:      string;
}

export interface AdminPaymentSummary {
  id:              string;
  bookingId:       string;
  gateway:         PaymentGateway;
  transactionId:   string | null;
  amountNgn:       string;
  status:          PaymentStatus;
  channel:         string | null;
  paidAt:          string | null;
  createdAt:       string;
  bookingRef:      string;
  checkIn:         string;
  checkOut:        string;
  receiptUrl:      string | null;
  guestFirstName:  string;
  guestLastName:   string;
  roomTypeName:    string;
  tenantName:      string;
}
export interface Payment {
  id:             string;
  bookingId:      string;
  tenantId:       string;
  guestUserId:    string;
  gateway:        PaymentGateway;
  transactionId?: string;
  amountNgn:      number;
  status:         PaymentStatus;
  channel?:       string;
  paidAt?:        string;
  refundedAt?:    string;
  createdAt:      string;
  updatedAt:      string;
}

export interface InitializePaymentPayload {
  bookingId:   string;
  gateway:     PaymentGateway;
  callbackUrl: string;
  phone?:      string;
}

export interface InitializePaymentResponse {
  success: boolean;
  data: {
    paymentId:     string;
    transactionId: string;
    redirectUrl:   string;
    amountNgn:     number;
  };
}

export interface PaymentListResponse {
  success: boolean;
  data:    Payment[];
}

//  Escrow 

export type EscrowStatus =
  | "held"
  | "released"
  | "refunded"
  | "partially_refunded";

export interface Escrow {
  id:              string;
  bookingId:       string;
  tenantId:        string;
  amountNgn:       number;
  platformFeeNgn:  number;
  hostPayoutNgn:   number;
  status:          EscrowStatus;
  heldAt:          string;
  releasedAt?:     string;
  refundedAt?:     string;
  refundAmountNgn?: number;
  createdAt:       string;
  updatedAt:       string;
  // joined in from bookings by the list endpoint
  bookingRef:      string;
  checkIn:         string;
  checkOut:        string;
}

export interface EscrowListResponse {
  success: boolean;
  data:    Escrow[];
}

export interface EscrowStats {
  held:     { count: number; amountNgn: number };
  released: { count: number; amountNgn: number };
  refunded: { count: number; amountNgn: number };
  currentMonthVolumeNgn:  number;
  previousMonthVolumeNgn: number;
  volumeGrowthPct: number;
}

export interface EscrowStatsResponse {
  success: boolean;
  data:    EscrowStats;
}

//  Audit 

export type AuditAction =
  | "created"
  | "updated"
  | "deleted"
  | "status_changed"
  | "payment"
  | "login"
  | "logout";

export interface AuditLog {
  id:         string;
  action:     AuditAction;
  resource:   string;
  resourceId: string;
  tenantId?:  string;
  userId:     string;
  newValue?:  Record<string, unknown>;
  oldValue?:  Record<string, unknown>;
  createdAt:  string;
}

export interface AuditListResponse {
  success: boolean;
  data:    AuditLog[];
}

//  Notification 

export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_checked_in"
  | "booking_checked_out"
  | "payment_confirmed"
  | "payment_failed"
  | "auth_otp"
  | "auth_registered"
  | "escrow_released"
  | "escrow_refunded";

export type NotificationStatus = "pending" | "sent" | "failed" | "skipped";

export interface Notification {
  id:               string;
  type:             NotificationType;
  channel:          "email" | "sms" | "email_and_sms";
  status:           NotificationStatus;
  recipientEmail?:  string;
  recipientPhone?:  string;
  tenantId?:        string;
  userId?:          string;
  subject?:         string;
  message:          string;
  metadata:         Record<string, unknown>;
  sentAt?:          string;
  failureReason?:   string;
  createdAt:        string;
}

export interface NotificationListResponse {
  success: boolean;
  data:    Notification[];
}

export interface SecurityStatus {
  isEmailVerified:  boolean;
  isPhoneVerified:  boolean;
  twoFactorEnabled: boolean;
  loginWithPinEnabled: boolean;
  countryCode:      string | null;
  hasPin:           boolean;
}

export interface SecurityStatusResponse {
  success: boolean;
  data:    SecurityStatus;
}

export type OtpPurpose = "email_verify" | "phone_verify" | "two_factor_enable" | "two_factor_disable";

export interface RequestOtpResponse {
  success: boolean;
  message: string;
  expiresInSeconds: number;
}

//  RBAC 

// Fixed system role slugs still exist and are useful for UI logic (e.g.
// "is this the host:admin row"), but custom roles have dynamic slugs now,
// so anywhere a role slug is accepted/returned generally, the type is
// `string`, not this union.
export type SystemRoleSlug =
  | "platform:admin"
  | "host:admin"
  | "host:staff"
  | "host:inspector"
  | "guest";

export interface Role {
  id:          string;
  name:        string;
  slug:        string;
  description: string;
  isSystem:    boolean;
  tenantId:    string | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface UserRoleAssignment {
  id:          string;
  userId:      string;
  tenantId:    string;
  roleId:      string;
  roleName:    string;
  roleSlug:    string;
  assignedBy:  string;
  assignedAt:  string;
  reason?:     string;
  isActive:    boolean;
}

export interface Permission {
  id:           string;
  resource:     string;
  action:       string;
  description?: string;
  category:     string;
}

export interface UserPermissionOverride {
  id:           string;
  userId:       string;
  tenantId:     string;
  permissionId: string;
  permission:   Permission;
  granted:      boolean;
  assignedBy:   string;
  assignedAt:   string;
  reason?:      string;
}

export interface AssignRolePayload {
  userId:   string;
  roleSlug: string;
  reason?:  string;
}

export interface GrantPermissionPayload {
  userId:       string;
  permissionId: string;
  granted:      boolean;
  reason?:      string;
}

export interface ResolvedPermissions {
  userId:   string;
  tenantId: string;
  granted:  string[];
}

export interface RoleListResponse {
  success: boolean;
  data:    Role[];
}

export interface RoleMember {
  userId:     string;
  firstName?: string;
  lastName?:  string;
  email?:     string;
  assignedAt: string;
}

export interface RoleDetail {
  role:                 Role;
  includedPermissions:  Permission[];
  availablePermissions: Permission[];
  members:              RoleMember[];
}

export interface RoleDetailResponse {
  success: boolean;
  data:    RoleDetail;
}

export interface CreateCustomRolePayload {
  name:           string;
  description?:   string;
  permissionIds:  string[];
}

export interface UpdateRolePermissionsPayload {
  roleId:        string;
  permissionIds: string[];
}

export interface PermissionListResponse {
  success: boolean;
  data:    Permission[];
}

export interface RoomTypeWithOccupancy extends RoomType {
  occupancy_status:         "occupied" | "vacant" | "maintenance";
  active_maintenance_count: number;
  current_tenant_name:      string | null;
}

export interface PropertyWithRoomTypes extends Property {
  roomTypes: RoomType[];
  fromPrice?: number | null;
}

// Matches backend/src/domains/review/review.repository.ts exactly, no
// transform layer exists for this domain, snake_case as returned.
export interface Review {
  id:                    string;
  room_type_id:          string;
  property_id:           string;
  tenant_id:             string;
  guest_user_id:         string;
  booking_id:            string;
  rating:                number;
  title:                 string;
  comment:               string;
  images:                string[];
  is_verified_purchase:  boolean;
  status:                "approved" | "rejected";
  helpful_count:         number;
  unhelpful_count:       number;
  response_text:         string | null;
  response_by:           string | null;
  response_at:           string | null;
  created_at:            string;
  updated_at:            string;
  // present on the guest-joined variant (room-type review list)
  guest_first_name?:     string;
  guest_last_name?:      string;
  guest_profile_image?:  string | null;
}

export interface ReviewStats {
  averageRating:      number;
  totalReviews:       number;
  verifiedCount:      number;
  ratingDistribution: Record<string, number>;
}

export interface RoomTypeReviewsResponse {
  success: boolean;
  data: {
    reviews:    Review[];
    stats:      ReviewStats;
    totalCount: number;
    page:       number;
    limit:      number;
  };
}

export interface CreateReviewPayload {
  bookingId: string;
  rating:    number;
  title:     string;
  comment:   string;
  images?:   string[];
}

export interface CreateReviewResponse {
  success: boolean;
  data:    Review;
}

// Matches backend/src/domains/renter/renter.repository.ts's Renter
// interface exactly, the API returns these fields as-is (snake_case),
// no transformResponse layer exists for this endpoint.
export interface Renter {
  id:                       string;
  owner_id:                 string;
  full_name:                string;
  email:                    string | null;
  phone:                    string | null;
  emergency_contact_name:   string | null;
  emergency_contact_phone:  string | null;
  created_at:               string;
  updated_at:               string;
}

// Matches backend/src/domains/invoice/invoice.repository.ts exactly, no
// transform layer for this domain, snake_case as returned.
export type InvoiceType = "guest_invoice" | "host_statement";

export interface Invoice {
  id:             string;
  invoice_number: string;
  type:           InvoiceType;
  booking_id:     string;
  tenant_id:      string;
  guest_user_id?: string;
  amount_ngn:     number;
  pdf_url:        string | null;
  created_at:     string;
}

export interface InvoiceResponse {
  success: boolean;
  data:    Invoice;
}

// Matches backend/src/domains/seller-notification/seller-notification.repository.ts
export type SellerNotificationType = "booking_confirmed" | "booking_checked_in" | "booking_checked_out";

export interface SellerNotification {
  id:         string;
  tenant_id:  string;
  booking_id: string | null;
  type:       SellerNotificationType;
  title:      string;
  body:       string;
  is_read:    boolean;
  created_at: string;
}

export interface SellerNotificationListResponse {
  success: boolean;
  data: {
    notifications: SellerNotification[];
    unreadCount:   number;
    totalPages:number
  };
}

export interface FavoriteProperty {
  id:            string;
  name:          string;
  images:        string[];
  city:          string;
  property_type: string;
  from_price:    number | null;
  favorited_at:  string;
}


export interface UpdateRoomTypePayload {
  name?:         string;
  description?:  string;
  maxOccupancy?: number;
  basePriceNgn?: number;
  images?:       string[];
  amenities?:    string[];
  quantity?:     number;
  status?:       RoomStatus;
}

export interface TwoFactorChallengeResponse {
  success: boolean;
  message: string;
  data: {
    twoFactorRequired: true;
    challengeToken: string;
  };
}

export type LoginResponse = AuthTokens | TwoFactorChallengeResponse;
export interface AdminTenantDetailResponse {
  success: boolean;
  data: {
    tenant: Tenant;
    stats: {
      escrow: { held: { count: number; amountNgn: number }; released: { count: number; amountNgn: number }; refunded: { count: number; amountNgn: number }; currentMonthVolumeNgn: number; previousMonthVolumeNgn: number; volumeGrowthPct: number };
      properties: { count: number; [key: string]: unknown };
      bookings: { count: number; [key: string]: unknown };
    };
    recentPurchases: Array<{ id: string; amount_ngn: number; host_payout_ngn: number; status: string; held_at: string; booking_ref: string }>;
    recentActivity: Array<{ id: string; action: string; resource: string; created_at: string; actor_first_name: string | null; actor_last_name: string | null }>;
  };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string;
  actorFirstName: string | null;
  actorLastName: string | null;
  tenantName: string | null;
  createdAt: string;
}

export interface PlatformStatsResponse {
  success: boolean;
  data: {
    tenants: { active: number; suspended: number; draft: number };
    guests: number;
    administrators: number;
    properties: number;
    bookings: {
      confirmedCount: number;
      checkedInCount: number;
      checkedOutCount: number;
      cancelledCount: number;
      pendingCount: number;
    };
    volume: {
      currentMonthNgn: number;
      previousMonthNgn: number;
      growthPct: number;
    };
    revenueSplit: {
      hostPayoutNgn: number;
      platformFeeNgn: number;
    };
    paymentsCount: number;
    guestBreakdown: {
      total: number;
      verified: number;
      viaGoogle: number;
    };
  };
}

export interface AdminAdministratorSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}