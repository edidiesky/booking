// Form input types — decoupled from backend DTOs.
// These match react-hook-form field shapes, not API payloads.

//  Auth forms 

export interface LoginFormValues {
  email:    string;
  password: string;
}

export interface InitiateFormValues {
  email:           string;
  password:        string;
  confirmPassword: string;
}

export interface OtpFormValues {
  token: string;
}

export interface GuestDetailsFormValues {
  firstName: string;
  lastName:  string;
  phone?:    string;
}

export interface HostDetailsFormValues {
  firstName:      string;
  lastName:       string;
  phone?:         string;
  tenantName:     string;
  tenantSlug:     string;
  platformFeePct: number;
}

//  Profile form 

export interface ProfileFormValues {
  displayName: string;
  bio?:        string;
  avatarUrl?:  string;
  city?:       string;
  state?:      string;
  country?:    string;
}

//  Tenant settings forms 

export interface TenantSettingsFormValues {
  timezone: string;
  currency: string;
  locale:   string;
}

export interface CancellationTierFormValues {
  hours_before: number;
  refund_pct:   number;
}

export interface CancellationPolicyFormValues {
  tiers: CancellationTierFormValues[];
}

//  Property forms 

export interface PropertyFormValues {
  name:          string;
  description:   string;
  propertyType:  "shortlet" | "hotel" | "guesthouse";
  street:        string;
  city:          string;
  state:         string;
  country:       string;
  lat?:          number;
  lng?:          number;
  amenities:     string[];
  checkInTime:   string;
  checkOutTime:  string;
}

export interface RoomTypeFormValues {
  name:          string;
  description?:  string;
  maxOccupancy:  number;
  basePriceNgn:  number;
  quantity:      number;
  amenities:     string[];
}

export interface SeedCalendarFormValues {
  startDate: string;
  endDate:   string;
}

export interface BlockDatesFormValues {
  startDate: string;
  endDate:   string;
  block:     boolean;
}

//  Booking form 

export interface BookingFormValues {
  checkIn:          string;
  checkOut:         string;
  roomsCount:       number;
  guestCount:       number;
  specialRequests?: string;
}

export interface CancelBookingFormValues {
  reason?: string;
}

//  Payment form 

export interface PaymentFormValues {
  gateway:     "paystack" | "flutterwave";
  callbackUrl: string;
  phone?:      string;
}

//  RBAC forms 

export interface AssignRoleFormValues {
  userId:   string;
  roleSlug: string;
  reason?:  string;
}

export interface GrantPermissionFormValues {
  userId:       string;
  permissionId: string;
  granted:      boolean;
  reason?:      string;
}