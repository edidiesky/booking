/** Hot: paginated host booking + payment lists */
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

export default function () {
  const token = hostToken();
  if (!token) {
    sleep(1);
    return;
  }
  const page = (__ITER % 3) + 1;
  const bookings = http.get(
    `${baseUrl()}/api/v1/bookings/tenant?page=${page}&limit=10`,
    { headers: jsonHeaders(token) },
  );
  const payments = http.get(
    `${baseUrl()}/api/v1/payments/tenant?page=${page}&limit=10`,
    { headers: jsonHeaders(token) },
  );
  not5xx(bookings);
  not5xx(payments);
  sleep(0.2);
}
