import { Router } from "express";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { CreateRenterHandler, ListRentersHandler, GetRenterDetailHandler } from "./renter.controller";
import { createRenterSchema } from "./renter.validator";

const router = Router();

router.post("/",   authenticate, requireTenantMember, validate(createRenterSchema), CreateRenterHandler);
router.get("/",    authenticate, requireTenantMember,                              ListRentersHandler);
router.get("/:id", authenticate, requireTenantMember,                              GetRenterDetailHandler);

export default router;