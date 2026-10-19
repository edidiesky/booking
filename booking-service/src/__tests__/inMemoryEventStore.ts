export class ConcurrencyError extends Error {
  constructor(aggregateId: string, expectedVersion: number) {
    super(`Aggregate ${aggregateId} concurrent write, expected version ${expectedVersion}`);
    this.name = "ConcurrencyError";
  }
}

export interface StoredEvent {
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  version: number;
}

export class InMemoryEventStore {
  private events = new Map<string, StoredEvent[]>();

  async append(
    aggregateId: string,
    _aggregateType: string,
    expectedVersion: number,
    events: Array<{ eventType: string; payload: Record<string, unknown> }>,
  ): Promise<void> {
    const existing = this.events.get(aggregateId) ?? [];
    const current = existing.length === 0 ? 0 : existing[existing.length - 1]!.version;
    if (current !== expectedVersion) {
      throw new ConcurrencyError(aggregateId, expectedVersion);
    }
    const next = [...existing];
    for (let i = 0; i < events.length; i++) {
      next.push({
        aggregateId,
        eventType: events[i]!.eventType,
        payload: events[i]!.payload,
        version: expectedVersion + i + 1,
      });
    }
    this.events.set(aggregateId, next);
  }

  async getEvents(aggregateId: string): Promise<StoredEvent[]> {
    return [...(this.events.get(aggregateId) ?? [])];
  }

  async getCurrentVersion(aggregateId: string): Promise<number> {
    const list = this.events.get(aggregateId) ?? [];
    return list.length === 0 ? 0 : list[list.length - 1]!.version;
  }
}
