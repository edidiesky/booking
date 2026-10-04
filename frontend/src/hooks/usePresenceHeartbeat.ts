import { useEffect } from "react";
import { API_BASE_URL } from "@/constants/api";

const HEARTBEAT_INTERVAL_MS = 60_000;

export function usePresenceHeartbeat(isAuthenticated: boolean) {
  useEffect(() => {
    if (!isAuthenticated) return;

    const beat = () => {
      if (document.visibilityState !== "visible") return;
      fetch(`${API_BASE_URL}/me/presence/heartbeat`, { method: "POST", credentials: "include" }).catch(() => {
        // Real, a missed heartbeat just means this session shows
        // offline a bit early, not a real error worth surfacing to
        // the user.
      });
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