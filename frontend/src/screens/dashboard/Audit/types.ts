export type ActorType = "user" | "api_key" | "system" | "impersonation";
export type Outcome = "allowed" | "denied";

export interface AuditEvent {
  id: string;
  sequence: string;
  tenantId: string;
  actorType: ActorType;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  affectedUserId: string | null;
  affectedUserEmail: string | null;
  outcome: Outcome;
  denialReason: string | null;
  changedFields: string[] | null;
  beforeValue: Record<string, unknown> | null;
  afterValue: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  originIp: string | null;
  originCountry: string | null;
  requestId: string | null;
  occurredAt: string;
  recordedAt: string;
}

export interface AuditEventFilters {
  page?: number;
  limit?: number;
  actor?: string;
  actorType?: ActorType;
  action?: string;
  outcome?: Outcome;
  affectedUser?: string;
  targetType?: string;
  targetId?: string;
  changedField?: string;
  requestId?: string;
  occurredAfter?: string;
  occurredBefore?: string;
}
