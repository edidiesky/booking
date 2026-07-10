import asyncHandler from "express-async-handler";
import { Request, Response, Router } from "express";
import { webhookService } from "./webhook.service";
import { AppError } from "../../utils/AppError";
import logger from "../../utils/logger";
import { PaymentGateway } from "../../types";

const SIGNATURE_HEADERS: Partial<Record<PaymentGateway, string>> = {
  paystack: "x-paystack-signature",
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
    const signature = signatureHeader
      ? (req.headers[signatureHeader] as string)
      : undefined;
logger.info("webhook_body_debug", {
  isBuffer: Buffer.isBuffer(req.body),
  bodyType: typeof req.body,
  bodyPreview: Buffer.isBuffer(req.body) ? req.body.toString("utf8").slice(0, 80) : JSON.stringify(req.body).slice(0, 80),
});
    try {
      await webhookService.process(gateway, req.body, signature);
    } catch (err) {
      logger.error("webhook_handler_error", {
        event: "webhook_handler_error",
        gateway,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    res.status(200).json({ message: "Received." });
  },
);

const router = Router();

router.post("/:gateway", HandleWebhookHandler);

export default router;
