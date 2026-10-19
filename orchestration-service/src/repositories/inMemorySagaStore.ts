import { randomUUID } from "crypto";
import { SagaStatus } from "./saga.repository";
import { SagaStore } from "./saga.store";

interface Row {
  id: string;
  saga_type: string;
  status: SagaStatus;
  current_step: number;
  context: unknown;
  booking_id: string | null;
  claimed_by: string | null;
  lease_expires_at: number | null;
}

/** Mirrors production sagaRepository semantics for unit tests. */
export class InMemorySagaStore implements SagaStore {
  private rows = new Map<string, Row>();

  async insert(sagaType: string, context: unknown, bookingId?: string) {
    const id = randomUUID();
    this.rows.set(id, {
      id,
      saga_type: sagaType,
      status: "running",
      current_step: 0,
      context: structuredClone(context),
      booking_id: bookingId ?? null,
      claimed_by: null,
      lease_expires_at: null,
    });
    return id;
  }

  async claim(sagaId: string, leaseMs: number) {
    const row = this.rows.get(sagaId);
    if (!row) return null;
    if (row.status !== "running" && row.status !== "compensating") return null;
    const now = Date.now();
    if (row.lease_expires_at !== null && row.lease_expires_at > now) return null;
    row.claimed_by = randomUUID();
    row.lease_expires_at = now + leaseMs;
    return {
      id: row.id,
      current_step: row.current_step,
      context: structuredClone(row.context),
    };
  }

  async findById(sagaId: string) {
    const row = this.rows.get(sagaId);
    if (!row) return null;
    return {
      status: row.status,
      context: structuredClone(row.context),
      current_step: row.current_step,
    };
  }

  async updateProgress(sagaId: string, step: number, context: unknown) {
    const row = this.rows.get(sagaId);
    if (!row) return;
    row.current_step = step;
    row.context = structuredClone(context);
  }

  async updateStatus(sagaId: string, status: SagaStatus) {
    const row = this.rows.get(sagaId);
    if (!row) return;
    row.status = status;
    row.lease_expires_at = null;
    row.claimed_by = null;
  }

  async markPaused(sagaId: string, nextStep: number, context: unknown) {
    const row = this.rows.get(sagaId);
    if (!row) return;
    row.status = "running";
    row.current_step = nextStep;
    row.context = structuredClone(context);
    row.lease_expires_at = null;
    row.claimed_by = null;
  }

  forceActiveLease(sagaId: string, leaseMs: number) {
    const row = this.rows.get(sagaId);
    if (!row) return;
    row.lease_expires_at = Date.now() + leaseMs;
    row.claimed_by = randomUUID();
  }

  getRow(sagaId: string) {
    return this.rows.get(sagaId);
  }
}
