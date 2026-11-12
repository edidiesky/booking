import { useEffect, useReducer, useRef } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { selectAccessToken } from "@/redux/slices/authSlice";
import { apiSlice } from "@/redux/services/apiSlice";
import { fetchEventSource } from "@/lib/fetchEventSource";
import { PROPERTY_IMPORT_URL } from "@/constants/api";
import {
  propertyImportApi,
  type ImportEvent,
  type ImportRowError,
  type ImportSnapshot,
} from "@/redux/services/propertyImportApi";

export type StreamConnection =
  | "idle"
  | "connecting"
  | "live"
  | "reconnecting"
  | "closed";

interface State {
  snapshot: ImportSnapshot | null;
  connection: StreamConnection;
}

type Action =
  | { type: "reset" }
  | { type: "connection"; value: StreamConnection }
  | { type: "snapshot"; snapshot: ImportSnapshot }
  | { type: "event"; event: ImportEvent };

const errorKey = (e: ImportRowError) =>
  `${e.row}|${e.column ?? ""}|${e.message}`;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset":
      return { snapshot: null, connection: "idle" };
    case "connection":
      return { ...state, connection: action.value };
    case "snapshot":
      return { ...state, snapshot: action.snapshot };
    case "event": {
      const s = state.snapshot;
      if (!s) return state;
      const e = action.event;
      switch (e.type) {
        case "stage":
          if (s.status === "completed" || s.status === "failed") return state;
          return {
            ...state,
            snapshot: {
              ...s,
              status: e.stage,
              progress: Math.max(s.progress, e.progress),
            },
          };
        case "row_errors": {
          const seen = new Set(s.errors.map(errorKey));
          const fresh = e.errors.filter((x) => !seen.has(errorKey(x)));
          return fresh.length
            ? { ...state, snapshot: { ...s, errors: [...s.errors, ...fresh] } }
            : state;
        }
        case "property_created":
          if (s.createdProperties.some((p) => p.ref === e.property.ref))
            return state;
          return {
            ...state,
            snapshot: {
              ...s,
              createdProperties: [...s.createdProperties, e.property],
            },
          };
        case "completed":
          return {
            ...state,
            snapshot: {
              ...s,
              status: "completed",
              progress: 100,
              totals: e.totals,
            },
          };
        case "failed":
          return {
            ...state,
            snapshot: { ...s, status: "failed", failureReason: e.reason },
          };
      }
    }
  }
  return state;
}

const isTerminal = (s: ImportSnapshot | null) =>
  s?.status === "completed" || s?.status === "failed";
const MAX_BACKOFF_MS = 15_000;

/**
 * Live import progress. Every (re)connect starts with a full snapshot from
 * the server, so a dropped connection, a refreshed tab or a second device
 * always converges on the true state. Reconnects with backoff until the
 * import reaches a terminal state.
 */
export function usePropertyImportStream(batchId: string | null) {
  const dispatch = useAppDispatch();
  const token = useSelector(selectAccessToken);
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const [state, send] = useReducer(reducer, {
    snapshot: null,
    connection: "idle",
  });
  const terminalRef = useRef(false);

  useEffect(() => {
    terminalRef.current = isTerminal(state.snapshot);
  }, [state.snapshot]);

  useEffect(() => {
    if (!batchId) {
      send({ type: "reset" });
      return;
    }
    const controller = new AbortController();
    let attempt = 0;

    const run = async () => {
      while (!controller.signal.aborted && !terminalRef.current) {
        send({
          type: "connection",
          value: attempt === 0 ? "connecting" : "reconnecting",
        });
        let unauthorized = false;
        await fetchEventSource({
          url: `${PROPERTY_IMPORT_URL}/${batchId}/stream`,
          token: tokenRef.current ?? "",
          signal: controller.signal,
          onEvent: (event, data) => {
            if (!data) return; // heartbeat comments arrive as empty frames
            attempt = 0;
            send({ type: "connection", value: "live" });
            try {
              const parsed = JSON.parse(data);
              if (event === "snapshot") {
                send({ type: "snapshot", snapshot: parsed as ImportSnapshot });
                if (isTerminal(parsed as ImportSnapshot))
                  terminalRef.current = true;
              } else {
                send({ type: "event", event: parsed as ImportEvent });
                if (event === "completed" || event === "failed")
                  terminalRef.current = true;
              }
            } catch {
              /* ignore malformed frame */
            }
          },
          onError: (err) => {
            unauthorized = err.message.includes("401");
          },
        });

        if (controller.signal.aborted || terminalRef.current) break;

        if (unauthorized) {
          // Runs the app's normal refresh flow and gives us a fresh snapshot.
          const refresh = dispatch(
            propertyImportApi.endpoints.getPropertyImport.initiate(batchId, {
              forceRefetch: true,
            }),
          );
          await refresh;
          refresh.unsubscribe();
        }
        attempt++;
        const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** (attempt - 1));
        await new Promise((r) => setTimeout(r, delay));
      }
      send({ type: "connection", value: "closed" });
    };

    void run();
    return () => controller.abort();
  }, [batchId, dispatch]);

  // Imported properties should appear in the table without a manual refresh.
  useEffect(() => {
    if (state.snapshot?.status === "completed") {
      dispatch(apiSlice.util.invalidateTags(["Property"]));
    }
  }, [state.snapshot?.status, dispatch]);

  return state;
}
