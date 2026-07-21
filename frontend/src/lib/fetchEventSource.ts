interface FetchEventSourceOptions {
  url: string;
  token: string;
  onEvent: (event: string, data: string) => void;
  onError: (err: Error) => void;
  signal: AbortSignal;
}

/**
 * Minimal SSE client built on fetch + ReadableStream, used wherever
 * EventSource's header limitation (no Authorization support) is a blocker.
 * Parses the standard "event: x\ndata: y\n\n" frame format.
 */
export async function fetchEventSource({
  url,
  token,
  onEvent,
  onError,
  signal,
}: FetchEventSourceOptions): Promise<void> {
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      credentials: "include",
      signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`SSE request failed with status ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        if (!frame.trim()) continue;

        let eventName = "message";
        let data = "";

        for (const line of frame.split("\n")) {
          if (line.startsWith("event:")) eventName = line.slice(6).trim();
          else if (line.startsWith("data:")) data += line.slice(5).trim();
        }

        onEvent(eventName, data);
      }
    }
  } catch (err) {
    if (signal.aborted) return; // intentional close, not a real error
    onError(err instanceof Error ? err : new Error("Unknown stream error"));
  }
}