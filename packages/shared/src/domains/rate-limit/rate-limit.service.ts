import { rateLimitRepository } from "./rate-limit.repository";
import type { RulesSyncPubSub } from "./rules-sync";
import type { CreateRuleInput, UpdateRuleInput, RateLimitRuleRow } from "./types";

export function createRateLimitService(rulesSync: RulesSyncPubSub) {
  return {
    async createRule(input: CreateRuleInput): Promise<RateLimitRuleRow> {
      const rule = await rateLimitRepository.create(input);
      await rulesSync.publishReload();
      return rule;
    },

    async updateRule(id: string, input: UpdateRuleInput): Promise<RateLimitRuleRow | null> {
      const rule = await rateLimitRepository.update(id, input);
      if (rule) await rulesSync.publishReload();
      return rule;
    },

    async deleteRule(id: string): Promise<boolean> {
      const deleted = await rateLimitRepository.delete(id);
      if (deleted) await rulesSync.publishReload();
      return deleted;
    },

    async getRule(id: string): Promise<RateLimitRuleRow | null> {
      return rateLimitRepository.getById(id);
    },

    async listRules(page: number, limit: number): Promise<RateLimitRuleRow[]> {
      return rateLimitRepository.list(page, limit);
    },
  };
}

export type RateLimitService = ReturnType<typeof createRateLimitService>;