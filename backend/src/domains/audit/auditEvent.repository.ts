import { PoolClient } from "pg";
import { query, queryOne } from "@booking/shared";

export type ActorType = "user" | "api_key" | "system" | "impersonation";
export type Outcome = "allowed" | "denied";

export interface AuditActor {
  type: ActorType;
  id?: string;
  email?: string;
  name?: string;
}

export interface RecordAuditEventInput {
  tenantId?: string;
  actor: AuditActor;
  action: string;
  targetType?: string;
  targetId?: string;
  affectedUserId?: string;
  affectedUserEmail?: string;
  outcome: Outcome;
  denialReason?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  originIp?: string;
  requestId?: string;
  occurredAt?: Date;
}

export interface AuditEventRow {
  id: string;
  sequence: string;
  tenant_id: string;
  actor_type: ActorType;
  actor_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  affected_user_id: string | null;
  affected_user_email: string | null;
  outcome: Outcome;
  denial_reason: string | null;
  changed_fields: string[] | null;
  before_value: Record<string, unknown> | null;
  after_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  origin_ip: string | null;
  origin_country: string | null;
  request_id: string | null;
  occurred_at: Date;
  recorded_at: Date;
}

function diffKeys(
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null,
): string[] {
  if (!before && !after) return [];
  const keys = new Set<string>([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);
  return [...keys].filter(
    (k) => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]),
  );
}

export interface AuditEventFilters {
  tenantId: string;
  actor?: string; // matches actor_id or actor_email
  actorType?: ActorType;
  action?: string; // exact, or 'member.*' prefix
  outcome?: Outcome;
  affectedUser?: string;
  targetType?: string;
  targetId?: string;
  changedField?: string;
  requestId?: string;
  occurredAfter?: Date;
  occurredBefore?: Date;
}

export const auditEventRepository = {
  async record(
    input: RecordAuditEventInput,
    client: PoolClient,
  ): Promise<AuditEventRow> {
    const changedFields =
      input.before !== undefined || input.after !== undefined
        ? diffKeys(input.before, input.after)
        : null;

    const row = (
      await client.query<AuditEventRow>(
        `INSERT INTO audit_events (
           tenant_id, actor_type, actor_id, actor_email, actor_name,
           action, target_type, target_id, affected_user_id, affected_user_email,
           outcome, denial_reason, changed_fields, before_value, after_value,
           metadata, origin_ip, request_id, occurred_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::jsonb,$16::jsonb,$17,$18,$19)
         RETURNING *`,
        [
          input.tenantId,
          input.actor.type,
          input.actor.id ?? null,
          input.actor.email ?? null,
          input.actor.name ?? null,
          input.action,
          input.targetType ?? null,
          input.targetId ?? null,
          input.affectedUserId ?? null,
          input.affectedUserEmail ?? null,
          input.outcome,
          input.denialReason ?? null,
          changedFields,
          input.before !== undefined ? JSON.stringify(input.before) : null,
          input.after !== undefined ? JSON.stringify(input.after) : null,
          JSON.stringify(input.metadata ?? {}),
          input.originIp ?? null,
          input.requestId ?? null,
          input.occurredAt ?? new Date(),
        ],
      )
    ).rows[0];

    return row;
  },

  // The structured-filter read path, "the schema is the query
  // language": every filter here maps directly to an indexed column,
  // there is no free-text search, matching the source's stated
  // position that a text box over an audit log is an admission the
  // schema was never finished.
  async list(
    filters: AuditEventFilters,
    page: number,
    limit: number,
  ): Promise<AuditEventRow[]> {
    const conditions: string[] = ["tenant_id = $1"];
    const params: unknown[] = [filters.tenantId];
    let i = 2;

    if (filters.actor) {
      conditions.push(`(actor_id::text = $${i} OR actor_email = $${i})`);
      params.push(filters.actor);
      i++;
    }
    if (filters.actorType) {
      conditions.push(`actor_type = $${i}`);
      params.push(filters.actorType);
      i++;
    }
    if (filters.action) {
      if (filters.action.endsWith("*")) {
        conditions.push(`action LIKE $${i}`);
        params.push(filters.action.slice(0, -1) + "%");
        i++;
      } else {
        conditions.push(`action = $${i}`);
        params.push(filters.action);
        i++;
      }
    }
    if (filters.outcome) {
      conditions.push(`outcome = $${i}`);
      params.push(filters.outcome);
      i++;
    }
    if (filters.affectedUser) {
      conditions.push(
        `(affected_user_id::text = $${i} OR affected_user_email = $${i})`,
      );
      params.push(filters.affectedUser);
      i++;
    }
    if (filters.targetType) {
      conditions.push(`target_type = $${i}`);
      params.push(filters.targetType);
      i++;
    }
    if (filters.targetId) {
      conditions.push(`target_id = $${i}`);
      params.push(filters.targetId);
      i++;
    }
    if (filters.changedField) {
      conditions.push(`changed_fields @> ARRAY[$${i}]::text[]`);
      params.push(filters.changedField);
      i++;
    }
    if (filters.requestId) {
      conditions.push(`request_id = $${i}`);
      params.push(filters.requestId);
      i++;
    }
    if (filters.occurredAfter) {
      conditions.push(`occurred_at >= $${i}`);
      params.push(filters.occurredAfter);
      i++;
    }
    if (filters.occurredBefore) {
      conditions.push(`occurred_at <= $${i}`);
      params.push(filters.occurredBefore);
      i++;
    }

    params.push(limit, (page - 1) * limit);

    return query<AuditEventRow>(
      `SELECT * FROM audit_events WHERE ${conditions.join(" AND ")}
       ORDER BY occurred_at DESC LIMIT $${i} OFFSET $${i + 1}`,
      params,
    );
  },

  // Single-event fetch by id, deliberately separate from list()'s
  // structured-filter surface, "get me event X" and "filter events by
  // Y" are different real operations, not the same thing with a
  // narrower filter. tenantId still required, RLS aside, this is a
  // real, explicit belt-and-suspenders check at the query level too.
  async getById(id: string, tenantId: string): Promise<AuditEventRow | null> {
    return queryOne<AuditEventRow>(
      `SELECT * FROM audit_events WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
  },

  // The one exception to append-only, a narrow, auditable-itself
  // operation. See migration 048's erase_audit_identity function, this
  // just calls it, doesn't reimplement it.
  async eraseIdentity(userId: string, client: PoolClient): Promise<number> {
    const result = await client.query<{ erase_audit_identity: number }>(
      `SELECT erase_audit_identity($1)`,
      [userId],
    );
    return result.rows[0]?.erase_audit_identity ?? 0;
  },
};
