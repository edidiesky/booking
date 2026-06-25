import { JWTPayload } from "./index";

declare global {
  namespace Express {
    interface Request {
      user?:             JWTPayload;
      tenantId?:         string;
      tenantSlug?:       string;
      idempotencyHash?:  string;
      idempotencyEndpoint?: string;
    }
  }
}
