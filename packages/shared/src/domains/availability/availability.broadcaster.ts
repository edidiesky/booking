import redisClient from "../../config/redis";

const channelName = (roomTypeId: string) => `availability:room_type:${roomTypeId}`;

export const availabilityBroadcaster = {
  publish(roomTypeId: string, event: { type: "locked" | "released" | "booked" | "blocked" | "unblocked"; checkIn: string; checkOut: string }): void {
    void redisClient.publish(channelName(roomTypeId), JSON.stringify({ ...event, roomTypeId, at: new Date().toISOString() }));
  },

  async subscribe(roomTypeId: string, onMessage: (payload: unknown) => void): Promise<() => Promise<void>> {
    const sub = redisClient.duplicate();
    const ch = channelName(roomTypeId);

    await sub.subscribe(ch);
    sub.on("message", (receivedChannel: string, message: string) => {
      if (receivedChannel === ch) onMessage(JSON.parse(message));
    });

    return async () => { await sub.unsubscribe(ch); await sub.quit(); };
  },
};