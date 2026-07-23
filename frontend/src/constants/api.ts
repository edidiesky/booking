const BASE = import.meta.env.VITE_API_BASE_URL as string;

export const AUTH_URL         = `${BASE}/api/v1/auth`;
export const PROFILE_URL      = `${BASE}/api/v1/profile`;
export const TENANT_URL       = `${BASE}/api/v1/tenants`;
export const PROPERTY_URL     = `${BASE}/api/v1/properties`;
export const BOOKING_URL      = `${BASE}/api/v1/bookings`;
export const PAYMENT_URL      = `${BASE}/api/v1/payments`;
export const WEBHOOK_URL      = `${BASE}/api/v1/webhooks`;
export const ESCROW_URL       = `${BASE}/api/v1/escrow`;
export const AUDIT_URL        = `${BASE}/api/v1/audit`;
export const NOTIFICATION_URL = `${BASE}/api/v1/notifications`;
export const ROLE_URL         = `${BASE}/api/v1/roles`;
export const PERMISSION_URL   = `${BASE}/api/v1/permissions`;
export const SSE_URL          = `${BASE}/api/v1/sse`;
export const RENTER_URL          = `${BASE}/api/v1/renters`; //SECURITY_URL
export const SECURITY_URL          = `${BASE}/api/v1/security`; //SECURITY_URL