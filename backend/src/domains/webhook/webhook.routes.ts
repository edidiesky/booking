import asyncHandler from "express-async-handler";
import { Request, Response, Router } from "express";
import { webhookService } from "./webhook.service";
import { AppError }       from "../../utils/AppError";
import logger             from "../../utils/logger";
import { PaymentGateway } from "../../types";

const SIGNATURE_HEADERS: Partial<Record<PaymentGateway, string>> = {
  paystack:    "x-paystack-signature",
  flutterwave: "verif-hash",
};

export const HandleWebhookHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const gateway = req.params["gateway"] as PaymentGateway;
    const validGateways: PaymentGateway[] = ["paystack", "flutterwave"];

    if (!validGateways.includes(gateway)) {
      throw AppError.badRequest(`Unsupported gateway: ${gateway}`);
    }

    const signatureHeader = SIGNATURE_HEADERS[gateway];
    const signature       = signatureHeader
      ? (req.headers[signatureHeader] as string | undefined)
      : undefined;

    res.status(200).json({ received: true });

    // Process async - errors are logged internally by webhookService
    webhookService.process(gateway, req.body as Record<string, unknown>, signature).catch((err) => {
      logger.error("webhook_handler_unhandled", {
        event:   "webhook_handler_unhandled",
        gateway,
        error:   (err as Error).message,
      });
    });
  }
);

const router = Router();

router.post("/:gateway", HandleWebhookHandler);

export default router;
