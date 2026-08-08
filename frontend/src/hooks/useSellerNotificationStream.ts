import { useEffect } from "react";
import { useSelector } from "react-redux";
import { fetchEventSource } from "@/lib/fetchEventSource";
import { selectAccessToken } from "@/redux/slices/authSlice";
import type { SellerNotification } from "@/types/api";

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS     = 30_000;

/**
 * Connects to the existing generic /sse/connect endpoint and listens for
 * the "seller_notification" event type the isolated
 * seller-notification-worker publishes via Redis pub/sub.
 *
 * Reconnects with exponential backoff (1s, 2s, 4s... capped at 30s) on
 * any disconnect, previously this had no reconnect at all: once the
 * connection dropped for any reason (server restart, network blip,
 * laptop sleep/wake, a backend deploy), live notifications silently
 * stopped forever with zero recovery attempt. Two distinct ways a
 * connection can end have to both trigger a reconnect: fetchEventSource
 * calling onError (a thrown exception), and fetchEventSource's promise
 * simply resolving (the stream's read loop hit `done: true`, a clean
 * close with no exception at all, onError never fires for that case).
 * Missing either one would still leave a real gap. Backoff resets to 1s
 * whenever an event actually arrives, proof the connection is healthy,
 * not just open.
 */
export function useSellerNotificationStream(onNotification?: (n: SellerNotification) => void) {
  const token = useSelector(selectAccessToken);

  useEffect(() => {
    if (!token || !onNotification) return;

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
        url: `${import.meta.env.VITE_API_BASE_URL}/api/v1/sse/connect`,
        token,
        signal: controller.signal,
        onEvent: (eventName, data) => {
          backoffMs = INITIAL_BACKOFF_MS; // connection proven healthy, reset backoff
          if (eventName !== "seller_notification") return;
          try {
            const payload = JSON.parse(data) as {
              id: string; type: SellerNotification["type"]; title: string; body: string;
              bookingId: string | null; createdAt: string; isRead: boolean;
            };
            onNotification({
              id: payload.id,
              tenant_id: "",
              booking_id: payload.bookingId,
              type: payload.type,
              title: payload.title,
              body: payload.body,
              is_read: payload.isRead,
              created_at: payload.createdAt,
            });
          } catch {
            // malformed frame, ignore, next event still arrives
          }
        },
        onError: () => {
          scheduleReconnect();
        },
      }).then(() => {
        // Resolved without throwing: a clean close, still needs a
        // reconnect, this is the case onError alone would miss entirely.
        scheduleReconnect();
      });
    };

    connect();

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      controller.abort();
    };
  }, [token, onNotification]);
}