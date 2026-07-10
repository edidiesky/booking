import { BaseNotificationHandler } from "./base.handler";
import { ROUTING_KEYS } from "../../messaging/connection";
import { RentalsRecordUpsertedPayload } from "../../messaging/publisher";
import { renterRepository } from "../../domains/renter/renter.repository";
import { logger } from "@booking/shared";

export class RentalsRecordUpsertedHandler extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.RENTERS_RECORED_UPSERTED;

  protected async handle(data: unknown): Promise<void> {
    const e = data as RentalsRecordUpsertedPayload;

    const notification = await renterRepository.upsertFromBooking({
      ownerId: e.ownerId,
      guestUserId: e.guestUserId,
      fullName: e.fullName,
      email: e.email,
      phone: e.phone,
    });

    logger.info("Tenant record ahs been upserted:", {
        notification
    })
  }
}

export const rentalsRecordUpsertedHandle = new RentalsRecordUpsertedHandler();
