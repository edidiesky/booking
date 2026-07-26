

export type AudienceField =
  | "userType"          // eq
  | "status"             // eq
  | "countryCode"        // eq
  | "createdWithinDays"  // lte  (account age)
  | "lastActiveWithinDays" // lte
  | "lastBookingWithinDays" // lte (guest-side: has a booking in the last N days)
  | "noBookingWithinDays"   // gte (guest-side: hasn't booked in at least N days, win-back audiences)
  | "totalBookings"      // gte | lte | eq
  | "hasActiveProperty"; // eq (boolean, host-side)
 
export type AudienceOperator = "eq" | "gte" | "lte";
 
export interface AudienceCondition {
  field:    AudienceField;
  operator: AudienceOperator;
  value:    string | number | boolean;
}
 
export interface AudienceFilter {
  conditions: AudienceCondition[]; // ANDed
}
 