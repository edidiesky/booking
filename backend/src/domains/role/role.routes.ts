
import { Router } from "express";
import { authenticate, authorize, requireTenantMember } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/require-permission.middleware";
import {
  ListRolesHandler,
  GetTenantRolesHandler,
  GetTenantRoleListHandler,
  GetRoleDetailHandler,
  CreateCustomRoleHandler,
  UpdateRolePermissionsHandler,
  GetUserRoleHandler,
  AssignRoleHandler,
  RevokeRoleHandler,
  GrantUserPermissionHandler,
  GetUserPermissionsHandler,
  RevokeUserPermissionHandler,
  GetResolvedPermissionsHandler,
} from "./role.controller";

const router = Router();

router.get("/", authenticate, ListRolesHandler);

router.get(
  "/tenant",
  authenticate,
  requireTenantMember,
  requirePermission("role", "read"),
  GetTenantRolesHandler,
);
router.get(
  "/tenant/list",
  authenticate,
  requireTenantMember,
  requirePermission("role", "read"),
  GetTenantRoleListHandler,
);
router.get(
  "/tenant/roles/:roleId",
  authenticate,
  requireTenantMember,
  requirePermission("role", "read"),
  GetRoleDetailHandler,
);
router.get(
  "/tenant/users/:userId",
  authenticate,
  requireTenantMember,
  requirePermission("role", "read"),
  GetUserRoleHandler,
);
router.get(
  "/tenant/users/:userId/permissions",
  authenticate,
  requireTenantMember,
  requirePermission("permission", "read"),
  GetUserPermissionsHandler,
);
router.get(
  "/tenant/users/:userId/permissions/resolved",
  authenticate,
  requireTenantMember,
  requirePermission("permission", "read"),
  GetResolvedPermissionsHandler,
);

router.post(
  "/tenant/roles",
  authenticate,
  requireTenantMember,
  authorize("host:admin"),
  requirePermission("permission", "assign"),
  CreateCustomRoleHandler,
);
router.patch(
  "/tenant/roles/:roleId/permissions",
  authenticate,
  requireTenantMember,
  authorize("host:admin"),
  requirePermission("permission", "assign"),
  UpdateRolePermissionsHandler,
);
router.post(
  "/tenant/assign",
  authenticate,
  requireTenantMember,
  authorize("host:admin"),
  requirePermission("role", "assign"),
  AssignRoleHandler,
);
router.delete(
  "/tenant/users/:userId/revoke",
  authenticate,
  requireTenantMember,
  authorize("host:admin"),
  requirePermission("role", "revoke"),
  RevokeRoleHandler,
);
router.post(
  "/tenant/users/permissions",
  authenticate,
  requireTenantMember,
  authorize("host:admin"),
  requirePermission("permission", "assign"),
  GrantUserPermissionHandler,
);
router.delete(
  "/tenant/users/:userId/permissions/:permissionId",
  authenticate,
  requireTenantMember,
  authorize("host:admin"),
  requirePermission("permission", "revoke"),
  RevokeUserPermissionHandler,
);

export default router;