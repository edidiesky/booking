import { Router } from "express";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { GetGuestInvoiceHandler, GetHostStatementHandler } from "./invoice.controller";

const router = Router();

router.get("/guest/:bookingId", authenticate,                       GetGuestInvoiceHandler);
router.get("/host/:bookingId",  authenticate, requireTenantMember,  GetHostStatementHandler);

export default router;