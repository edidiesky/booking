import { OutboxEvent } from "./notification.repository";
import { logger } from "../../logger";

export const notificationService = {
  async deliver(event: OutboxEvent): Promise<void> {
    if (event.event_type === "booking.escrow_released") {
      logger.info("notify_seller_new_sale", { payload: event.payload });
    }
  },
};
