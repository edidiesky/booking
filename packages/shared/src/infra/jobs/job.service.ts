import { randomUUID } from "crypto";
import { jobRepository } from "./job.repository";
import type { JobProgress } from "./job.types";

const isTerminal = (s: JobProgress) => s.state === "done" || s.state === "error";

export const jobService = {
  start(opts: { jobType: string; exchange: string; routingKey: string; payload: Record<string, unknown> }) {
    const jobId = randomUUID();
    void jobRepository.setState(opts.jobType, jobId, {
      jobId, jobType: opts.jobType, state: "queued", progress: 0, updatedAt: new Date().toISOString(),
    });
    jobRepository.publishToQueue(opts.exchange, opts.routingKey, { jobId, ...opts.payload });
    return { jobId };
  },

  getStatus<T>(jobType: string, jobId: string) {
    return jobRepository.getState<T>(jobType, jobId);
  },

  async streamProgress<T>(jobType: string, jobId: string, onEvent: (p: JobProgress<T>) => void) {
    const current = await jobRepository.getState<T>(jobType, jobId);
    if (current) {
      onEvent(current);
      if (isTerminal(current)) return { cleanup: async () => {}, alreadyTerminal: true };
    }
    let unsubscribe = async () => {};
    unsubscribe = await jobRepository.subscribe<T>(jobType, jobId, (payload) => {
      onEvent(payload);
      if (isTerminal(payload)) void unsubscribe();
    });
    return { cleanup: unsubscribe, alreadyTerminal: false };
  },
};