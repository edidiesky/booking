import { Pool } from "pg";
import { sagaRepository, SagaStatus } from "./saga.repository";

export type { SagaStatus };

export interface SagaStore {
  insert(sagaType: string, context: unknown, bookingId?: string): Promise<string>;
  claim(
    sagaId: string,
    leaseMs: number,
  ): Promise<{ id: string; current_step: number; context: unknown } | null>;
  findById(
    sagaId: string,
  ): Promise<{
    status: SagaStatus;
    context: unknown;
    current_step: number;
    booking_id?: string | null;
  } | null>;
  updateProgress(sagaId: string, step: number, context: unknown): Promise<void>;
  updateStatus(sagaId: string, status: SagaStatus): Promise<void>;
  markPaused(sagaId: string, nextStep: number, context: unknown): Promise<void>;
  /** Optional: lost-wakeup support */
  recordResumeSignal?(bookingId: string): Promise<void>;
  consumeResumeSignal?(bookingId: string): Promise<boolean>;
  findRunningByBookingId?(bookingId: string): Promise<{ id: string } | null>;
}

export function sagaStoreFromPool(pool: Pool): SagaStore {
  return {
    insert: (t, c, b) => sagaRepository.insert(pool, t, c, b),
    claim: (id, ms) => sagaRepository.claim(pool, id, ms),
    findById: (id) => sagaRepository.findById(pool, id),
    updateProgress: (id, s, c) => sagaRepository.updateProgress(pool, id, s, c),
    updateStatus: (id, st) => sagaRepository.updateStatus(pool, id, st),
    markPaused: (id, step, c) => sagaRepository.markPaused(pool, id, step, c),
    findRunningByBookingId: (bookingId) =>
      sagaRepository.findRunningByBookingId(pool, bookingId),
    recordResumeSignal: (bookingId) =>
      sagaRepository.recordResumeSignal(pool, bookingId),
    consumeResumeSignal: (bookingId) =>
      sagaRepository.consumeResumeSignal(pool, bookingId),
  };
}
