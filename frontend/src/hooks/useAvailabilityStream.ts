import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { fetchEventSource } from "@/lib/fetchEventSource";
import { selectAccessToken } from "@/redux/slices/authSlice";

export interface AvailabilityEvent {
  type:       "locked" | "released" | "booked" | "blocked" | "unblocked";
  roomTypeId: string;
  checkIn:    string;
  checkOut:   string;
  at:         string;
}

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS     = 30_000;

// Reconnects with exponential backoff on disconnect, same fix as
// useSellerNotificationStream, and arguably more important here: a guest
// mid-booking-flow relying on this for live lock/availability state
// silently going stale after a dropped connection could show a room as
// available when it's actually just been locked by someone else,
// worse than a stale notification list. Covers both onError firing and
// the connection promise simply resolving (a clean close with no
// exception, onError alone wouldn't catch that case).
export function useAvailabilityStream(roomTypeId: string | undefined) {
  const token = useSelector(selectAccessToken);
  const [lastEvent, setLastEvent] = useState<AvailabilityEvent | null>(null);

  useEffect(() => {
    if (!roomTypeId || !token) return;

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
        url: `${import.meta.env.VITE_API_BASE_URL}/api/v1/properties/room-types/${roomTypeId}/availability/stream`,
        token,
        signal: controller.signal,
        onEvent: (eventName, data) => {
          backoffMs = INITIAL_BACKOFF_MS;
          if (eventName !== "availability") return;
          try {
            setLastEvent(JSON.parse(data) as AvailabilityEvent);
          } catch {
            // malformed frame, ignore, next event still arrives
          }
        },
        onError: () => {
          scheduleReconnect();
        },
      }).then(() => {
        scheduleReconnect();
      });
    };

    connect();

    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      controller.abort();
    };
  }, [roomTypeId, token]);

  return lastEvent;
}