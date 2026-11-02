/** Hot: property + room-type detail */
import http from "k6/http";
import { sleep } from "k6";
import { baseUrl, propertyId, vus, duration } from "../lib/config.js";
import { not5xx, statusOneOf } from "../lib/checks.js";
import { readHeavy } from "../lib/thresholds.js";

export const options = {
  vus: vus(),
  duration: duration(),
  thresholds: readHeavy,
};

export default function () {
  const id = propertyId();
  if (!id) {
    // fallback list then skip
    http.get(`${baseUrl()}/api/v1/properties?limit=1`);
    sleep(0.2);
    return;
  }
  const res = http.get(`${baseUrl()}/api/v1/properties/${id}`);
  statusOneOf(res, [200, 404], "detail");
  not5xx(res);
  sleep(0.1);
}
