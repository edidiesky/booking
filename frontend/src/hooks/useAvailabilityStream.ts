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

export function useAvailabilityStream(roomTypeId: string | undefined) {
  const token = useSelector(selectAccessToken);
  const [lastEvent, setLastEvent] = useState<AvailabilityEvent | null>(null);

  useEffect(() => {
    if (!roomTypeId || !token) return;

    const controller = new AbortController();

    void fetchEventSource({
      url: `${import.meta.env.VITE_API_BASE_URL}/api/v1/properties/room-types/${roomTypeId}/availability/stream`,
      token,
      signal: controller.signal,
      onEvent: (eventName, data) => {
        if (eventName !== "availability") return;
        try {
          setLastEvent(JSON.parse(data) as AvailabilityEvent);
        } catch {
          // malformed frame, ignore, next event still arrives
        }
      },
      onError: () => {
        // connection dropped, no retry loop here by design, avoids a
        // reconnect storm against a backend that might genuinely be down
      },
    });

    return () => controller.abort();
  }, [roomTypeId, token]);

  return lastEvent;
}