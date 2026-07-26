import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { fetchEventSource } from "@/lib/fetchEventSource";
import { selectAccessToken } from "@/redux/slices/authSlice";
import type { JobState } from "@/redux/services/roomImportApi";

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS     = 30_000;

/**
 * Live job progress via the job's own SSE stream endpoint
 * (GET /jobs/:jobType/:jobId/stream), not polling. The backend's
 * jobRepository.setState() already publishes to Redis pub/sub on every
 * state change, this just relays that. Same reconnect-with-backoff
 * discipline as useSellerNotificationStream/useAvailabilityStream, a job
 * that takes a while (a large PDF export) shouldn't silently stop
 * reporting progress if the connection blips.
 */
export function useJobStream(jobType: string, jobId: string | null, onUpdate: (state: JobState) => void) {
  const token = useSelector(selectAccessToken);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!jobId || !token) return;

    const controller = new AbortController();
    let stopped = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let backoffMs = INITIAL_BACKOFF_MS;

    const scheduleReconnect = () => {
      if (stopped || controller.signal.aborted) return;
      retryTimer = setTimeout(() => {
        backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
        connect();
      }, backoffMs);
    };

    const connect = () => {
      fetchEventSource({
        url: `${import.meta.env.VITE_API_BASE_URL}/api/v1/jobs/${jobType}/${jobId}/stream`,
        token,
        signal: controller.signal,
        onEvent: (eventName, data) => {
          backoffMs = INITIAL_BACKOFF_MS;
          if (eventName !== "job_progress") return;
          try {
            const state = JSON.parse(data) as JobState;
            onUpdateRef.current(state);
            if (state.state === "done" || state.state === "error") {
              stopped = true;
              controller.abort();
            }
          } catch {
            // malformed frame, ignore, next event still arrives
          }
        },
        onError: () => {
          scheduleReconnect();
        },
      }).then(() => {
        if (!stopped) scheduleReconnect();
      });
    };

    connect();

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      controller.abort();
    };
  }, [jobType, jobId, token]);
}