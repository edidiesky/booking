import { useEffect, useState } from "react";
import { BASE } from "@/constants/api";

export function usePresenceStream(): Record<string, boolean> {
  const [presence, setPresence] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const source = new EventSource(`${BASE}/api/v1/me/presence/stream`, {
      withCredentials: true,
    });

    source.onmessage = (event) => {
      const data = JSON.parse(event.data) as
        | { onlineSessionIds: string[] }
        | { sessionId: string; isOnline: boolean };

      if ("onlineSessionIds" in data) {
        setPresence(
          Object.fromEntries(data.onlineSessionIds.map((id) => [id, true])),
        );
      } else {
        setPresence((prev) => ({
          ...prev,
          [data.sessionId]: data.isOnline,
        }));
      }
    };

    source.onerror = () => {
      /* optional: reconnect logic */
    };

    return () => source.close();
  }, []);

  return presence;
}