import { randomUUID } from "crypto";
import { SagaStatus, ClaimedSaga, SagaRecord } from "./saga.repository";
import { SagaStore } from "./saga.store";

interface Row {
  id: string;
  status: SagaStatus;
  current_step: number;
  context: unknown;
  booking_id: string | null;
  idempotency_key: string | null;
  last_error: string | null;
  compensation_cursor: number | null;
  compensation_attempts: number;
  forward_attempts: number;
  claimed_by: string | null;
  lease_expires_at: number | null;
  created: number;
}

/** Mirrors production sagaRepository semantics for unit tests. */
export class InMemorySagaStore implements SagaStore {
  private rows = new Map<string, Row>();
  private signals = new Map<string, boolean>(); // bookingId -> pending

  async insert(_t: string, context: unknown, bookingId?: string, key?: string) {
    if (key) {
      for (const r of this.rows.values()) {
        if (r.idempotency_key === key) return { id: r.id, created: false };
      }
    }
    if (bookingId) {
      for (const r of this.rows.values()) {
        if (r.booking_id === bookingId && (r.status === "running" || r.status === "compensating")) {
          return { id: r.id, created: false };
        }
      }
    }
    const id = randomUUID();
    this.rows.set(id, {
      id, status: "running", current_step: 0,
      context: structuredClone(context),
      booking_id: bookingId ?? null, idempotency_key: key ?? null,
      last_error: null, compensation_cursor: null,
      compensation_attempts: 0, forward_attempts: 0,
      claimed_by: null, lease_expires_at: null, created: Date.now() + this.rows.size,
    });
    return { id, created: true };
  }

  async claim(sagaId: string, leaseMs: number): Promise<ClaimedSaga | null> {
    const row = this.rows.get(sagaId);
    if (!row) return null;
    if (row.status !== "running" && row.status !== "compensating") return null;
    const now = Date.now();
    if (row.lease_expires_at !== null && row.lease_expires_at > now) return null;
    row.claimed_by = randomUUID();
    row.lease_expires_at = now + leaseMs;
    return {
      id: row.id, status: row.status, current_step: row.current_step,
      context: structuredClone(row.context),
      compensation_cursor: row.compensation_cursor,
      compensation_attempts: row.compensation_attempts,
      forward_attempts: row.forward_attempts,
    };
  }

  async renewLease(sagaId: string, leaseMs: number) {
    const row = this.rows.get(sagaId);
    if (row && row.claimed_by) row.lease_expires_at = Date.now() + leaseMs;
  }

  private rec(row: Row): SagaRecord {
    return {
      id: row.id, status: row.status, context: structuredClone(row.context),
      current_step: row.current_step, booking_id: row.booking_id, last_error: row.last_error,
    };
  }

  async findById(sagaId: string) {
    const row = this.rows.get(sagaId);
    return row ? this.rec(row) : null;
  }

  async findByBookingId(bookingId: string) {
    const matches = [...this.rows.values()]
      .filter((r) => r.booking_id === bookingId)
      .sort((a, b) => b.created - a.created);
    return matches[0] ? this.rec(matches[0]) : null;
  }

  private bid(context: unknown): string | null {
    const b = (context as { bookingId?: unknown } | null)?.bookingId;
    return typeof b === "string" ? b : null;
  }

  async updateProgress(sagaId: string, step: number, context: unknown) {
    const row = this.rows.get(sagaId);
    if (!row) return;
    row.current_step = step;
    row.context = structuredClone(context);
    row.booking_id = this.bid(context) ?? row.booking_id;
    row.forward_attempts = 0;
  }

  async updateStatus(sagaId: string, status: SagaStatus, error?: string) {
    const row = this.rows.get(sagaId);
    if (!row) return;
    row.status = status;
    if (error) row.last_error = error;
    row.lease_expires_at = null;
    row.claimed_by = null;
  }

  async markPaused(sagaId: string, nextStep: number, context: unknown) {
    const row = this.rows.get(sagaId);
    if (!row) return;
    row.status = "running";
    row.current_step = nextStep;
    row.context = structuredClone(context);
    row.booking_id = this.bid(context) ?? row.booking_id;
    row.forward_attempts = 0;
    row.lease_expires_at = null;
    row.claimed_by = null;
  }

  async beginCompensation(sagaId: string, error: string, cursor: number) {
    const row = this.rows.get(sagaId);
    if (!row) return;
    row.status = "compensating";
    row.last_error = error;
    row.compensation_cursor = cursor;
  }

  async saveCompensationCursor(sagaId: string, cursor: number) {
    const row = this.rows.get(sagaId);
    if (row) row.compensation_cursor = cursor;
  }

  async scheduleCompensationRetry(sagaId: string, attempts: number, error: string, delayMs: number) {
    const row = this.rows.get(sagaId);
    if (!row) return;
    row.status = "compensating";
    row.compensation_attempts = attempts;
    row.last_error = error;
    row.lease_expires_at = Date.now() + delayMs;
    row.claimed_by = null;
  }

  async scheduleForwardRetry(
    sagaId: string, step: number, context: unknown,
    attempts: number, error: string, delayMs: number,
  ) {
    const row = this.rows.get(sagaId);
    if (!row) return;
    row.status = "running";
    row.current_step = step;
    row.context = structuredClone(context);
    row.forward_attempts = attempts;
    row.last_error = error;
    row.lease_expires_at = Date.now() + delayMs;
    row.claimed_by = null;
  }

  async recordResumeSignal(bookingId: string) {
    this.signals.set(bookingId, true);
  }

  async consumeResumeSignal(bookingId: string) {
    const pending = this.signals.get(bookingId) === true;
    if (pending) this.signals.set(bookingId, false);
    return pending;
  }

  /** test helpers */
  forceActiveLease(sagaId: string, leaseMs: number) {
    const row = this.rows.get(sagaId);
    if (!row) return;
    row.lease_expires_at = Date.now() + leaseMs;
    row.claimed_by = randomUUID();
  }
  expireLease(sagaId: string) {
    const row = this.rows.get(sagaId);
    if (row) row.lease_expires_at = Date.now() - 1;
  }
  getRow(sagaId: string) {
    return this.rows.get(sagaId);
  }
}
