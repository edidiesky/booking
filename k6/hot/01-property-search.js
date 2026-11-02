/** Hot: public property search / listing + pagination */
import http from "k6/http";
import { sleep } from "k6";
import { baseUrl, vus, duration } from "../lib/config.js";
import { not5xx, statusOneOf } from "../lib/checks.js";
import { readHeavy } from "../lib/thresholds.js";

export const options = {
  vus: vus(),
  duration: duration(),
  thresholds: readHeavy,
};

export default function () {
  const page = (__ITER % 5) + 1;
  const res = http.get(
    `${baseUrl()}/api/v1/properties?page=${page}&limit=20`,
  );
  statusOneOf(res, [200], "search 200");
  not5xx(res);
  sleep(0.1);
}
