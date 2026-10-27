import { Pool } from "pg";
import {
  sagaRepository,
  SagaStatus,
  ClaimedSaga,
  SagaRecord,
} from "./saga.repository";

export type { SagaStatus, ClaimedSaga, SagaRecord };

export interface SagaStore {
  insert(
    sagaType: string,
    context: unknown,
    bookingId?: string,
    idempotencyKey?: string,
  ): Promise<{ id: string; created: boolean }>;
  claim(sagaId: string, leaseMs: number): Promise<ClaimedSaga | null>;
  renewLease(sagaId: string, leaseMs: number): Promise<void>;
  findById(sagaId: string): Promise<SagaRecord | null>;
  findByBookingId(bookingId: string): Promise<SagaRecord | null>;
  updateProgress(sagaId: string, step: number, context: unknown): Promise<void>;
  updateStatus(sagaId: string, status: SagaStatus, error?: string): Promise<void>;
  markPaused(sagaId: string, nextStep: number, context: unknown): Promise<void>;
  beginCompensation(sagaId: string, error: string, cursor: number): Promise<void>;
  saveCompensationCursor(sagaId: string, cursor: number): Promise<void>;
  scheduleCompensationRetry(
    sagaId: string, attempts: number, error: string, delayMs: number,
  ): Promise<void>;
  scheduleForwardRetry(
    sagaId: string, step: number, context: unknown,
    attempts: number, error: string, delayMs: number,
  ): Promise<void>;
  recordResumeSignal(bookingId: string): Promise<void>;
  consumeResumeSignal(bookingId: string): Promise<boolean>;
}

export function sagaStoreFromPool(pool: Pool): SagaStore {
  const r = sagaRepository;
  return {
    insert: (t, c, b, k) => r.insert(pool, t, c, b, k),
    claim: (id, ms) => r.claim(pool, id, ms),
    renewLease: (id, ms) => r.renewLease(pool, id, ms),
    findById: (id) => r.findById(pool, id),
    findByBookingId: (b) => r.findByBookingId(pool, b),
    updateProgress: (id, s, c) => r.updateProgress(pool, id, s, c),
    updateStatus: (id, st, e) => r.updateStatus(pool, id, st, e),
    markPaused: (id, s, c) => r.markPaused(pool, id, s, c),
    beginCompensation: (id, e, c) => r.beginCompensation(pool, id, e, c),
    saveCompensationCursor: (id, c) => r.saveCompensationCursor(pool, id, c),
    scheduleCompensationRetry: (id, a, e, d) => r.scheduleCompensationRetry(pool, id, a, e, d),
    scheduleForwardRetry: (id, s, c, a, e, d) => r.scheduleForwardRetry(pool, id, s, c, a, e, d),
    recordResumeSignal: (b) => r.recordResumeSignal(pool, b),
    consumeResumeSignal: (b) => r.consumeResumeSignal(pool, b),
  };
}
