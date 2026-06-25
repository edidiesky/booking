import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import {
  ListPermissionsHandler,
  GetPermissionsByRoleHandler,
  AddPermissionToRoleHandler,
  RemovePermissionFromRoleHandler,
} from "./permission.controller";

const router = Router();

// View permissions (any host member)
router.get("/",              authenticate, authorize("host:admin", "host:inspector", "platform:admin"), ListPermissionsHandler);
router.get("/role/:roleId",  authenticate, authorize("host:admin", "host:inspector", "platform:admin"), GetPermissionsByRoleHandler);

// Modify role permissions (platform:admin only - system roles are protected)
router.post("/role/add",     authenticate, authorize("platform:admin"), AddPermissionToRoleHandler);
router.post("/role/remove",  authenticate, authorize("platform:admin"), RemovePermissionFromRoleHandler);

export default router;
