type PresenceListener = (sessionId: string, isOnline: boolean) => void;

/**
 * In-process view of who is online.
 * Updated by heartbeats (local) and PresenceSync (expiry from Redis).
 */
export class PresenceEngine {
  private readonly online = new Set<string>();
  private readonly listeners = new Set<PresenceListener>();

  setOnline(sessionId: string): void {
    const was = this.online.has(sessionId);
    this.online.add(sessionId);
    if (!was) this.emit(sessionId, true);
  }

  setOffline(sessionId: string): void {
    const was = this.online.has(sessionId);
    this.online.delete(sessionId);
    if (was) this.emit(sessionId, false);
  }

  isOnline(sessionId: string): boolean {
    return this.online.has(sessionId);
  }

  listOnline(): string[] {
    return [...this.online];
  }

  onChange(listener: PresenceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(sessionId: string, isOnline: boolean): void {
    for (const listener of this.listeners) {
      try {
        listener(sessionId, isOnline);
      } catch {
        /* ignore listener errors */
      }
    }
  }
}