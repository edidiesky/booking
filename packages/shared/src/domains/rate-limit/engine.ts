import { rateLimitRepository } from "./rate-limit.repository";
import { resolveTier, type RateLimitRule, type RateLimitRuleRow, type Tier, type UserType } from "./types";

const RELOAD_INTERVAL_MS = 60_000;

function toEngineRule(row: RateLimitRuleRow): RateLimitRule {
  return {
    id: row.id,
    route: row.resource,
    tier: inferTierFromIdentity(row.id_type, row.id_value),
    algorithm: row.algorithm,
    limit: row.max_request,
    windowMs: row.interval_ms,
    enabled: row.enabled,
  };
}

function inferTierFromIdentity(idType: string, _idValue: string): Tier {
  if (idType === "ip") return "anonymous";
  if (idType === "api_key") return "host";
  return "guest";
}

const DEFAULTS: Record<Tier, RateLimitRule> = {
  platform: { id: "default-platform", route: "*", tier: "platform", algorithm: "token-bucket", limit: 1000, windowMs: 60_000, enabled: true },
  host:     { id: "default-host",     route: "*", tier: "host",     algorithm: "token-bucket", limit: 300,  windowMs: 60_000, enabled: true },
  guest:    { id: "default-guest",    route: "*", tier: "guest",    algorithm: "token-bucket", limit: 100,  windowMs: 60_000, enabled: true },
  anonymous:{ id: "default-anonymous",route: "*", tier: "anonymous",algorithm: "token-bucket", limit: 30,   windowMs: 60_000, enabled: true },
};

export class RateLimitEngine {
  private rules: Map<string, RateLimitRule> = new Map();
  private rulesByTier: Map<Tier, RateLimitRule[]> = new Map();
  private userOverrides: Map<string, RateLimitRule> = new Map();
  private reloadTimer: NodeJS.Timeout | null = null;

  private rebuildTierIndex(): void {
    const byTier = new Map<Tier, RateLimitRule[]>();
    for (const rule of this.rules.values()) {
      const bucket = byTier.get(rule.tier) ?? [];
      bucket.push(rule);
      byTier.set(rule.tier, bucket);
    }
    this.rulesByTier = byTier;
  }

  private async loadFromDB(): Promise<void> {
    const rows = await rateLimitRepository.getEnabled();
    const next = new Map<string, RateLimitRule>();
    for (const row of rows) next.set(row.id, toEngineRule(row));
    this.rules = next;
    this.rebuildTierIndex();
  }

  async start(): Promise<void> {
    await this.loadFromDB();
    this.reloadTimer = setInterval(() => {
      this.loadFromDB().catch(() => {
      });
    }, RELOAD_INTERVAL_MS);
  }

  stop(): void {
    if (this.reloadTimer) {
      clearInterval(this.reloadTimer);
      this.reloadTimer = null;
    }
  }

  async reload(): Promise<void> {
    await this.loadFromDB();
  }

  private routeMatches(incomingRoute: string, ruleRoute: string): boolean {
    if (ruleRoute.endsWith("*")) return incomingRoute.startsWith(ruleRoute.slice(0, -1));
    return incomingRoute === ruleRoute;
  }

  match(identityKey: string, route: string, userType?: UserType): RateLimitRule {
    const override = this.userOverrides.get(identityKey);
    if (override?.enabled) return override;

    const tier = resolveTier(userType);
    const candidates = this.rulesByTier.get(tier) ?? [];

    const exact = candidates.find((r) => r.enabled && r.route === route);
    if (exact) return exact;

    const wildcard = candidates.find((r) => r.enabled && this.routeMatches(route, r.route));
    if (wildcard) return wildcard;

    return DEFAULTS[tier];
  }

  async upsertRule(rule: RateLimitRule): Promise<void> {
    this.rules.set(rule.id, rule);
    this.rebuildTierIndex();
  }

  async deleteRule(ruleId: string): Promise<void> {
    this.rules.delete(ruleId);
    this.rebuildTierIndex();
  }

  setUserOverride(identityKey: string, rule: RateLimitRule): void {
    this.userOverrides.set(identityKey, rule);
  }

  removeUserOverride(identityKey: string): void {
    this.userOverrides.delete(identityKey);
  }

  getStats(): { ruleCount: number; overrideCount: number } {
    return { ruleCount: this.rules.size, overrideCount: this.userOverrides.size };
  }
}