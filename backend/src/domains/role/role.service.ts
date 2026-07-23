import Joi from "joi";
import { roleRepository }        from "./role.repository";
import { rolePermissionRepository } from "./role-permission.repository";
import { userRoleRepository }    from "../user-role/user-role.repository";
import { userPermissionRepository } from "../user-permission/user-permission.repository";
import { permissionRepository }  from "../permission/permission.repository";
import { permissionResolver }    from "../permission/permission.resolver";
import { userRepository }        from "../auth/auth.repository";
import { auditRepository }       from "../audit/audit.repository";
import { AppError }              from "../../utils/AppError";
import logger                    from "../../utils/logger";
import { requestContext }        from "../../context/requestContext";
import { RESOURCE_CATEGORY_LABEL } from "./role.constants";

// -- Validators --
const grantPermissionSchema = Joi.object({
  userId:       Joi.string().uuid().required(),
  permissionId: Joi.string().uuid().required(),
  granted:      Joi.boolean().required(),
  reason:       Joi.string().max(255).optional(),
});

const createRoleSchema = Joi.object({
  name:          Joi.string().min(2).max(100).required(),
  description:   Joi.string().max(255).allow("").optional(),
  permissionIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

const updateRolePermissionsSchema = Joi.object({
  permissionIds: Joi.array().items(Joi.string().uuid()).required(),
});

function ctx() { return requestContext.get() ?? {}; }

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function attachCategory(permission: { resource: string }) {
  return {
    ...permission,
    category: RESOURCE_CATEGORY_LABEL[permission.resource] ?? permission.resource,
  };
}

export const roleService = {
  // Platform-wide system roles only (no tenant context available, e.g. the
  // public role list before a tenant is known).
  async listRoles() {
    const roles = await roleRepository.findAllSystem();
    logger.info("roles_listed", { event: "roles_listed", count: roles.length, ...ctx() });
    return roles;
  },

  // System roles + this tenant's own custom roles, never another tenant's.
  async listRolesForTenant(tenantId: string) {
    const roles = await roleRepository.findAllForTenant(tenantId);
    logger.info("tenant_role_list", { event: "tenant_role_list", tenantId, count: roles.length, ...ctx() });
    return roles;
  },

  // Role detail: the role itself
  async getRoleDetail(roleId: string, tenantId: string) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw AppError.notFound("Role.");
    if (role.tenant_id !== null && role.tenant_id !== tenantId) {
      throw AppError.forbidden("This role does not belong to your tenant.");
    }

    const rolePerms  = await rolePermissionRepository.findByRoleId(roleId);
    const permIds    = rolePerms.map((rp) => rp.permission_id);
    const allPerms    = await permissionRepository.findAll();
    const included    = allPerms.filter((p) => permIds.includes(p.id)).map(attachCategory);
    const notIncluded = allPerms.filter((p) => !permIds.includes(p.id)).map(attachCategory);

    const members = await userRoleRepository.findActiveByRole(roleId, tenantId);

    return { role, includedPermissions: included, availablePermissions: notIncluded, members };
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

  // Assign or update role for a user. Previously validated roleSlug against
  // a hardcoded ORG_ASSIGNABLE_ROLE_SLUGS array, which meant every new
  // custom role required a code change + redeploy to become assignable.
  // Now checks the actual role exists and is visible to this tenant
  // (system role, or one of this tenant's own custom roles).
  async assignRole(data: {
    userId:       string;
    tenantId:     string;
    assignedById: string;
    body:         unknown;
  }) {
    const assignRoleSchema = Joi.object({
      userId:   Joi.string().uuid().required(),
      roleSlug: Joi.string().required(),
      reason:   Joi.string().max(255).optional(),
    });
    const { error, value } = assignRoleSchema.validate(data.body, { abortEarly: false, stripUnknown: true });
    if (error) throw AppError.badRequest(error.details[0].message);

    const { userId, roleSlug, reason } = value as { userId: string; roleSlug: string; reason?: string };

    const targetUser = await userRepository.findById(userId);
    if (!targetUser) throw AppError.notFound("User.");
    if (targetUser.tenant_id !== data.tenantId) throw AppError.forbidden("User does not belong to this tenant.");

    const role = await roleRepository.findBySlug(roleSlug);
    if (!role) throw AppError.notFound(`Role ${roleSlug}.`);
    if (role.tenant_id !== null && role.tenant_id !== data.tenantId) {
      throw AppError.forbidden("This role does not belong to your tenant.");
    }

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

  // Create a tenant-scoped custom role with an initial permission set
  // (Paystack's "Create a custom role" flow).
  async createCustomRole(tenantId: string, createdById: string, body: unknown) {
    const { error, value } = createRoleSchema.validate(body, { abortEarly: false, stripUnknown: true });
    if (error) throw AppError.badRequest(error.details[0].message);
    const { name, description, permissionIds } = value as {
      name: string; description?: string; permissionIds: string[];
    };

    const perms = await permissionRepository.findByIds(permissionIds);
    if (perms.length !== permissionIds.length) {
      throw AppError.badRequest("One or more permissions do not exist.");
    }

    const role = await roleRepository.create({
      name,
      slug: slugify(name),
      description: description ?? "",
      is_system: false,
      tenant_id: tenantId,
    });

    for (const permissionId of permissionIds) {
      await rolePermissionRepository.add(role.id, permissionId);
    }

    await auditRepository.log({
      action: "created", resource: "role", resourceId: role.id,
      tenantId, userId: createdById, newValue: { name, permissionIds },
    });

    logger.info("custom_role_created", { event: "custom_role_created", roleId: role.id, tenantId, ...ctx() });
    return roleService.getRoleDetail(role.id, tenantId);
  },

  // Update a role's permission
  async updateRolePermissions(roleId: string, tenantId: string, updatedById: string, body: unknown) {
    const { error, value } = updateRolePermissionsSchema.validate(body, { abortEarly: false, stripUnknown: true });
    if (error) throw AppError.badRequest(error.details[0].message);
    const { permissionIds } = value as { permissionIds: string[] };

    const role = await roleRepository.findById(roleId);
    if (!role) throw AppError.notFound("Role.");
    if (role.tenant_id !== null && role.tenant_id !== tenantId) {
      throw AppError.forbidden("This role does not belong to your tenant.");
    }

    if (permissionIds.length > 0) {
      const perms = await permissionRepository.findByIds(permissionIds);
      if (perms.length !== permissionIds.length) {
        throw AppError.badRequest("One or more permissions do not exist.");
      }
    }

    const current  = await rolePermissionRepository.findByRoleId(roleId);
    const currentIds = new Set(current.map((rp) => rp.permission_id));
    const desiredIds = new Set(permissionIds);

    const toAdd    = permissionIds.filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !desiredIds.has(id));

    for (const permissionId of toAdd)    await rolePermissionRepository.add(roleId, permissionId);
    for (const permissionId of toRemove) await rolePermissionRepository.remove(roleId, permissionId);

    const holders = await userRoleRepository.findActiveByRole(roleId, tenantId);
    await Promise.all(holders.map((h) => permissionResolver.invalidate(h.user_id, tenantId)));

    await auditRepository.log({
      action: "updated", resource: "role", resourceId: roleId,
      tenantId, userId: updatedById, newValue: { added: toAdd, removed: toRemove },
    });

    logger.info("role_permissions_updated", {
      event: "role_permissions_updated", roleId, tenantId,
      added: toAdd.length, removed: toRemove.length, ...ctx(),
    });

    return roleService.getRoleDetail(roleId, tenantId);
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