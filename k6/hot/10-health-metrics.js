/** Hot secondary: health + metrics scrape pressure */
import http from "k6/http";
import { sleep } from "k6";
import { baseUrl, vus, duration } from "../lib/config.js";
import { statusOneOf, not5xx } from "../lib/checks.js";
import { readHeavy } from "../lib/thresholds.js";

export const options = {
  vus: Math.min(vus(), 5),
  duration: duration(),
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const health = http.get(`${baseUrl()}/health`);
  statusOneOf(health, [200], "health");
  not5xx(health);

  // metrics may live on backend :4000 — override with METRICS_URL
  const metricsUrl = __ENV.METRICS_URL || `${baseUrl()}/metrics`;
  const metrics = http.get(metricsUrl);
  not5xx(metrics);
  sleep(0.5);
}
