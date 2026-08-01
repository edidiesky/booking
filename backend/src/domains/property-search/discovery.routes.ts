import { Router } from "express";
import { GetPopularPropertiesHandler, GetNewPropertiesHandler } from "./discovery.controller";

const router = Router();

router.get("/popular", GetPopularPropertiesHandler);
router.get("/new",     GetNewPropertiesHandler);

export default router;