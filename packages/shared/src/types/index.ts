export type UserType =
  | "guest"
  | "host:admin"
  | "host:staff"
  | "host:inspector"
  | "platform:admin";

export type TenantStatus   = "draft" | "active" | "suspended";
export type UserStatus     = "draft" | "active" | "inactive" | "suspended";
export type PropertyType   = "shortlet" | "hotel" | "guesthouse";
export type PropertyStatus = "draft" | "active" | "paused" | "archived";
export type RoomStatus     = "active" | "inactive";
export type BookingStatus  =
  | "pending_payment" | "confirmed" | "checked_in"
  | "checked_out"     | "cancelled" | "refunded";
export type PaymentStatus  = "pending" | "success" | "failed" | "refunded";
export type EscrowStatus   = "held" | "released" | "refunded" | "partially_refunded";
export type PaymentGateway = "paystack" | "flutterwave";
export type OutboxStatus   = "pending" | "processed" | "dead";
export type WebhookLogStatus = "pending" | "failed" | "permanent_failure" | "completed";
export type AuditAction    = "created" | "updated" | "deleted" | "status_changed" | "payment" | "login" | "logout";

export interface JWTPayload {
  userId:    string;
  userType:  UserType;
  tenantId?: string;
  name:      string;
}

export interface CancellationPolicyTier {
  hours_before: number;
  refund_pct:   number;
}

export interface TenantSettings {
  timezone: string;
  currency: string;
  locale:   string;
}

export interface PropertyAddress {
  street:  string;
  city:    string;
  state:   string;
  country: string;
  lat?:    number;
  lng?:    number;
}

export interface PaginationMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

// RBAC types
export type RoleSlug =
  | "platform:admin"
  | "host:admin"
  | "host:staff"
  | "host:inspector"
  | "guest";

export const RESOURCE = {
  BOOKING:    "booking",
  PROPERTY:   "property",
  ROOM_TYPE:  "room_type",
  PAYMENT:    "payment",
  ESCROW:     "escrow",
  TENANT:     "tenant",
  USER:       "user",
  PERMISSION: "permission",
  ROLE:       "role",
  REPORT:     "report",
} as const;
export type Resource = typeof RESOURCE[keyof typeof RESOURCE];

export const ACTION = {
  READ:    "read",
  CREATE:  "create",
  UPDATE:  "update",
  DELETE:  "delete",
  ASSIGN:  "assign",
  REVOKE:  "revoke",
  APPROVE: "approve",
  EXPORT:  "export",
} as const;
export type Action = typeof ACTION[keyof typeof ACTION];

// Seed types
export interface SeedRole {
  name:        string;
  slug:        RoleSlug;
  description: string;
  is_system:   boolean;
}

export interface SeedPermission {
  resource:    string;
  action:      string;
  description: string;
}

export interface SeedRolePermission {
  role_slug:  string;
  resource:   string;
  action:     string;
}
