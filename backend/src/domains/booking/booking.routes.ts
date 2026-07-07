
import { Router } from "express";
import { authenticate, authorize, requireTenantMember } from "../../middleware/auth.middleware";
import { validate }           from "../../middleware/validate.middleware";
import { CancelBookingHandler, CheckInHandler, CheckOutHandler, GetBookingHandler, GetMyBookingsHandler, GetTenantBookingsHandler, InitiateBookingHandler } from "./booking.controller";
import { cancelSchema, initiateSchema, listQuerySchema } from "./booking.validator";

//  Router 
const router = Router();

router.post("/",                     authenticate, authorize("guest"),    validate(initiateSchema),    InitiateBookingHandler);
router.get("/mine",                  authenticate, authorize("guest"),    validate(listQuerySchema, "query"), GetMyBookingsHandler);
router.get("/tenant",                authenticate, requireTenantMember,   validate(listQuerySchema, "query"), GetTenantBookingsHandler);
router.get("/:bookingId",            authenticate,                        GetBookingHandler);
router.patch("/:bookingId/cancel",   authenticate, authorize("guest"),    validate(cancelSchema),      CancelBookingHandler);
router.patch("/:bookingId/checkin",  authenticate, requireTenantMember,   CheckInHandler);
router.patch("/:bookingId/checkout", authenticate, requireTenantMember,   CheckOutHandler);

export default router;
