import { useEffect } from "react";
import { BASE } from "@/constants/api";

const HEARTBEAT_INTERVAL_MS = 60_000;

export function usePresenceHeartbeat(isAuthenticated: boolean) {
  useEffect(() => {
    if (!isAuthenticated) return;

    const beat = () => {
      if (document.visibilityState !== "visible") return;
      fetch(`${BASE}/me/presence/heartbeat`, {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    };

    beat();
    const interval = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener("visibilitychange", beat);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", beat);
    };
  }, [isAuthenticated]);
}
