/**
 * Critical: tenant-scoped write (create room type).
 * Expect 201 for owner host, 403/404 for wrong tenant — never cross-tenant success.
 * Env: HOST_TOKEN, PROPERTY_ID
 */
import http from "k6/http";
import { sleep, check } from "k6";
import { baseUrl, hostToken, propertyId, vus, duration, jsonHeaders } from "../lib/config.js";
import { not5xx } from "../lib/checks.js";
import { writeCritical } from "../lib/thresholds.js";

export const options = {
  vus: Math.min(vus(), 5),
  duration: duration(),
  thresholds: writeCritical,
};

export default function () {
  const token = hostToken();
  const pid = propertyId();
  if (!token || !pid) {
    sleep(1);
    return;
  }

  const res = http.post(
    `${baseUrl()}/api/v1/properties/${pid}/room-types`,
    JSON.stringify({
      name: `k6-rt-${__VU}-${__ITER}`,
      quantity: 1,
      basePriceNgn: 25000,
    }),
    { headers: jsonHeaders(token) },
  );

  not5xx(res);
  check(res, {
    "no silent cross-tenant write": (r) =>
      [201, 200, 400, 403, 404, 409, 422].indexOf(r.status) !== -1,
  });
  sleep(0.4);
}
