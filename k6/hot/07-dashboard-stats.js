/** Hot: host aggregate stats (bookings, payments, properties, escrow) */
import http from "k6/http";
import { sleep } from "k6";
import { baseUrl, hostToken, vus, duration, jsonHeaders } from "../lib/config.js";
import { not5xx } from "../lib/checks.js";
import { readHeavy } from "../lib/thresholds.js";

export const options = {
  vus: vus(),
  duration: duration(),
  thresholds: readHeavy,
};

const PATHS = [
  "/api/v1/bookings/tenant/stats",
  "/api/v1/payments/tenant/stats",
  "/api/v1/properties/mine/stats",
  "/api/v1/escrow/stats",
];

export default function () {
  const token = hostToken();
  if (!token) {
    sleep(1);
    return;
  }
  const path = PATHS[__ITER % PATHS.length];
  const res = http.get(`${baseUrl()}${path}`, { headers: jsonHeaders(token) });
  not5xx(res);
  sleep(0.15);
}
