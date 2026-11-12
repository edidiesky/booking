import type { JWTPayload, UserType } from "./index";

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      sessionId: string; 
      sessionVersion: number;
      tenantId?: string;
      userType?: UserType;
    }
  }
}
export {};