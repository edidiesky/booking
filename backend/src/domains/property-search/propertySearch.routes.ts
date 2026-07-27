import { Router } from "express";
import { SearchPropertiesHandler } from "./propertysearch.controller";

const router = Router();

router.get("/", SearchPropertiesHandler);

export default router;