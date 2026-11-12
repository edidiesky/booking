/** Shared env config for all scenarios */
export function baseUrl() {
  return __ENV.BASE_URL || "http://localhost:8080";
}

export function guestToken() {
  return __ENV.GUEST_TOKEN || "";
}

export function hostToken() {
  return __ENV.HOST_TOKEN || "";
}

export function propertyId() {
  return __ENV.PROPERTY_ID || "";
}

export function roomTypeId() {
  return __ENV.ROOM_TYPE_ID || "";
}

export function checkIn() {
  return __ENV.CHECK_IN || "2026-12-01";
}

export function checkOut() {
  return __ENV.CHECK_OUT || "2026-12-03";
}

export function vus() {
  return Number(__ENV.VUS || 10);
}

export function duration() {
  return __ENV.DURATION || "1m";
}

export function jsonHeaders(token) {
  const h = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}
