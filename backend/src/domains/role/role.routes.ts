import { Router } from "express";
import { authenticate, authorize, requireTenantMember } from "../../middleware/auth.middleware";
import {
  ListRolesHandler,
  GetTenantRolesHandler,
  GetUserRoleHandler,
  AssignRoleHandler,
  RevokeRoleHandler,
  GrantUserPermissionHandler,
  GetUserPermissionsHandler,
  RevokeUserPermissionHandler,
  GetResolvedPermissionsHandler,
} from "./role.controller";

const router = Router();

// Platform-wide role list (any authenticated user can see roles)
router.get("/",                                      authenticate,                           ListRolesHandler);

// Tenant-scoped role management (host:admin only)
router.get("/tenant",                                authenticate, requireTenantMember,      GetTenantRolesHandler);
router.get("/tenant/users/:userId",                  authenticate, requireTenantMember,      GetUserRoleHandler);
router.post("/tenant/assign",                        authenticate, authorize("host:admin"),  AssignRoleHandler);
router.delete("/tenant/users/:userId/revoke",        authenticate, authorize("host:admin"),  RevokeRoleHandler);

// Per-user direct permission overrides (host:admin only)
router.post("/tenant/users/permissions",             authenticate, authorize("host:admin"),  GrantUserPermissionHandler);
router.get("/tenant/users/:userId/permissions",      authenticate, requireTenantMember,      GetUserPermissionsHandler);
router.delete(
  "/tenant/users/:userId/permissions/:permissionId",
  authenticate, authorize("host:admin"),
  RevokeUserPermissionHandler
);

// Resolved permission set (for debugging / frontend-driven gates)
router.get("/tenant/users/:userId/permissions/resolved", authenticate, requireTenantMember, GetResolvedPermissionsHandler);

export default router;
