/** Reusable threshold presets */
export const readHeavy = {
  http_req_failed: ["rate<0.02"],
  http_req_duration: ["p(95)<800", "p(99)<2000"],
};

export const writeCritical = {
  http_req_failed: ["rate<0.01"],
  http_req_duration: ["p(95)<2000", "p(99)<5000"],
};

export const authStorm = {
  http_req_failed: ["rate<0.05"],
  http_req_duration: ["p(95)<1500"],
};

export const moneyPath = {
  http_req_failed: ["rate<0.01"],
  http_req_duration: ["p(95)<2500", "p(99)<6000"],
};
