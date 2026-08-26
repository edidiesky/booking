
export type UserType =
  | "guest"
  | "host:admin"
  | "host:staff"
  | "host:inspector"
  | "platform:admin";

export type Tier = "platform" | "host" | "guest" | "anonymous";

export function resolveTier(userType?: UserType): Tier {
  if (!userType) return "anonymous";
  if (userType === "platform:admin") return "platform";
  if (userType.startsWith("host:")) return "host";
  if (userType === "guest") return "guest";
  return "anonymous";
}

export type IdType = "ip" | "user_id" | "api_key";
export type Algorithm = "token-bucket" | "sliding-window-log";

export interface RateLimitRuleRow {
  id: string;
  id_type: IdType;
  id_value: string;
  resource: string;
  algorithm: Algorithm;
  max_request: number;
  interval_ms: number;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RateLimitRule {
  id: string;
  route: string;
  tier: Tier;
  algorithm: Algorithm;
  limit: number;
  windowMs: number;
  enabled: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  algorithm: Algorithm;
}

export interface CreateRuleInput {
  idType: IdType;
  idValue: string;
  resource: string;
  algorithm: Algorithm;
  maxRequest: number;
  intervalMs: number;
  enabled?: boolean;
}

export interface UpdateRuleInput {
  algorithm?: Algorithm;
  maxRequest?: number;
  intervalMs?: number;
  enabled?: boolean;
}