/** Hot: availability calendar read for room type */
import http from "k6/http";
import { sleep } from "k6";
import {
  baseUrl,
  roomTypeId,
  checkIn,
  checkOut,
  vus,
  duration,
} from "../lib/config.js";
import { not5xx, statusOneOf } from "../lib/checks.js";
import { readHeavy } from "../lib/thresholds.js";

export const options = {
  vus: vus(),
  duration: duration(),
  thresholds: readHeavy,
};

export default function () {
  const rt = roomTypeId();
  if (!rt) {
    sleep(1);
    return;
  }
  const res = http.get(
    `${baseUrl()}/api/v1/room-types/${rt}/availability?from=${checkIn()}&to=${checkOut()}`,
  );
  statusOneOf(res, [200, 404], "availability");
  not5xx(res);
  sleep(0.1);
}
