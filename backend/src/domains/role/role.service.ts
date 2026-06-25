import Joi from "joi";
import { roleRepository }        from "./role.repository";
import { userRoleRepository }    from "../user-role/user-role.repository";
import { userPermissionRepository } from "../user-permission/user-permission.repository";
import { permissionRepository }  from "../permission/permission.repository";
import { permissionResolver }    from "../permission/permission.resolver";
import { userRepository }        from "../auth/auth.repository";
import { auditRepository }       from "../audit/audit.repository";
import { AppError }              from "../../utils/AppError";
import logger                    from "../../utils/logger";
import { requestContext }        from "../../context/requestContext";
import { ORG_ASSIGNABLE_ROLE_SLUGS } from "./role.constants";

// -- Validators --
const assignRoleSchema = Joi.object({
  userId:   Joi.string().uuid().required(),
  roleSlug: Joi.string().valid(...ORG_ASSIGNABLE_ROLE_SLUGS).required(),
  reason:   Joi.string().max(255).optional(),
});

const grantPermissionSchema = Joi.object({
  userId:       Joi.string().uuid().required(),
  permissionId: Joi.string().uuid().required(),
  granted:      Joi.boolean().required(),
  reason:       Joi.string().max(255).optional(),
});

function ctx() { return requestContext.get() ?? {}; }

export const roleService = {
  // List all platform roles
  async listRoles() {
    const roles = await roleRepository.findAll();
    logger.info("roles_listed", { event: "roles_listed", count: roles.length, ...ctx() });
    return roles;
  },

  // Get all role assignments in tenant
  async getTenantRoles(tenantId: string) {
    const assignments = await userRoleRepository.findAllByTenant(tenantId);
    logger.info("tenant_roles_listed", { event: "tenant_roles_listed", tenantId, count: assignments.length, ...ctx() });
    return assignments;
  },

  // Get role for a specific user in tenant
  async getUserRole(userId: string, tenantId: string) {
    const assignment = await userRoleRepository.findByUserAndTenant(userId, tenantId);
    if (!assignment) throw AppError.notFound("Role assignment for this user.");
    return assignment;
  },

  // Assign or update role for a user
  async assignRole(data: {
    userId:       string;
    tenantId:     string;
    assignedById: string;
    body:         unknown;
  }) {
    const { error, value } = assignRoleSchema.validate(data.body, { abortEarly: false, stripUnknown: true });
    if (error) throw AppError.badRequest(error.details[0].message);

    const { userId, roleSlug, reason } = value as { userId: string; roleSlug: string; reason?: string };

    // Validate target user exists in this tenant
    const targetUser = await userRepository.findById(userId);
    if (!targetUser) throw AppError.notFound("User.");
    if (targetUser.tenant_id !== data.tenantId) throw AppError.forbidden("User does not belong to this tenant.");

    const role = await roleRepository.findBySlug(roleSlug);
    if (!role) throw AppError.notFound(`Role ${roleSlug}.`);

    const assignment = await userRoleRepository.assign({
      userId,
      tenantId: data.tenantId,
      roleId:   role.id,
      assignedBy: data.assignedById,
      reason,
    });

    await permissionResolver.invalidate(userId, data.tenantId);

    await auditRepository.log({
      action:     "updated",
      resource:   "user_role",
      resourceId: userId,
      tenantId:   data.tenantId,
      userId:     data.assignedById,
      newValue:   { roleSlug, reason },
    });

    logger.info("role_assigned", { event: "role_assigned", userId, roleSlug, tenantId: data.tenantId, ...ctx() });
    return assignment;
  },

  // Deactivate user's role in tenant
  async revokeRole(data: {
    userId:           string;
    tenantId:         string;
    requestingUserId: string;
  }) {
    if (data.userId === data.requestingUserId) {
      throw AppError.badRequest("You cannot revoke your own role.");
    }

    const targetUser = await userRepository.findById(data.userId);
    if (!targetUser) throw AppError.notFound("User.");
    if (targetUser.tenant_id !== data.tenantId) throw AppError.forbidden("User does not belong to this tenant.");

    await userRoleRepository.deactivate(data.userId, data.tenantId);
    await permissionResolver.invalidate(data.userId, data.tenantId);

    await auditRepository.log({
      action:     "status_changed",
      resource:   "user_role",
      resourceId: data.userId,
      tenantId:   data.tenantId,
      userId:     data.requestingUserId,
      newValue:   { action: "revoked" },
    });

    logger.info("role_revoked", { event: "role_revoked", userId: data.userId, tenantId: data.tenantId, ...ctx() });
  },

  // Grant or deny a direct user permission override
  async grantUserPermission(data: {
    tenantId:     string;
    assignedById: string;
    body:         unknown;
  }) {
    const { error, value } = grantPermissionSchema.validate(data.body, { abortEarly: false, stripUnknown: true });
    if (error) throw AppError.badRequest(error.details[0].message);

    const { userId, permissionId, granted, reason } = value as {
      userId: string; permissionId: string; granted: boolean; reason?: string;
    };

    const targetUser = await userRepository.findById(userId);
    if (!targetUser) throw AppError.notFound("User.");
    if (targetUser.tenant_id !== data.tenantId) throw AppError.forbidden("User does not belong to this tenant.");

    const perm = await permissionRepository.findById(permissionId);
    if (!perm) throw AppError.notFound("Permission.");

    const override = await userPermissionRepository.upsert({
      userId,
      tenantId:     data.tenantId,
      permissionId,
      granted,
      assignedBy:   data.assignedById,
      reason,
    });

    await permissionResolver.invalidate(userId, data.tenantId);

    await auditRepository.log({
      action:     "updated",
      resource:   "user_permission",
      resourceId: userId,
      tenantId:   data.tenantId,
      userId:     data.assignedById,
      newValue:   { permissionId, granted, reason },
    });

    logger.info("user_permission_granted", {
      event:        "user_permission_granted",
      userId,
      permissionId,
      granted,
      tenantId:     data.tenantId,
      ...ctx(),
    });

    return { ...override, permission: perm };
  },

  // List direct permission overrides for a user
  async getUserPermissions(userId: string, tenantId: string) {
    const overrides = await userPermissionRepository.findByUserAndTenant(userId, tenantId);
    if (!overrides.length) return [];

    const permIds = overrides.map((o) => o.permission_id);
    const perms   = await permissionRepository.findByIds(permIds);
    const permMap = new Map(perms.map((p) => [p.id, p]));

    return overrides
      .map((o) => {
        const perm = permMap.get(o.permission_id);
        if (!perm) return null;
        return { ...o, permission: perm };
      })
      .filter(Boolean);
  },

  // Revoke a single direct permission override
  async revokeUserPermission(data: {
    userId:           string;
    tenantId:         string;
    permissionId:     string;
    requestingUserId: string;
  }) {
    await userPermissionRepository.revoke(data.userId, data.tenantId, data.permissionId);
    await permissionResolver.invalidate(data.userId, data.tenantId);

    await auditRepository.log({
      action:     "deleted",
      resource:   "user_permission",
      resourceId: data.userId,
      tenantId:   data.tenantId,
      userId:     data.requestingUserId,
      newValue:   { permissionId: data.permissionId, action: "revoked" },
    });

    logger.info("user_permission_revoked", {
      event:        "user_permission_revoked",
      userId:       data.userId,
      permissionId: data.permissionId,
      tenantId:     data.tenantId,
      ...ctx(),
    });
  },

  // Get the fully resolved permission set for a user
  async getResolvedPermissions(userId: string, tenantId: string) {
    const granted = await permissionResolver.resolve(userId, tenantId);
    return { userId, tenantId, granted: [...granted] };
  },
};
