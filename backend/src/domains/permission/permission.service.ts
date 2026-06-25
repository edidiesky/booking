import Joi from "joi";
import { permissionRepository }  from "./permission.repository";
import { rolePermissionRepository } from "../role/role-permission.repository";
import { roleRepository }        from "../role/role.repository";
import { permissionResolver }    from "./permission.resolver";
import { auditRepository }       from "../audit/audit.repository";
import { AppError }              from "../../utils/AppError";
import logger                    from "../../utils/logger";
import { requestContext }        from "../../context/requestContext";

const addPermissionToRoleSchema = Joi.object({
  roleId:       Joi.string().uuid().required(),
  permissionId: Joi.string().uuid().required(),
});

const removePermissionFromRoleSchema = Joi.object({
  roleId:       Joi.string().uuid().required(),
  permissionId: Joi.string().uuid().required(),
});

function ctx() { return requestContext.get() ?? {}; }

export const permissionService = {
  async listAll() {
    const permissions = await permissionRepository.findAll();
    logger.info("permissions_listed", { event: "permissions_listed", count: permissions.length, ...ctx() });
    return permissions;
  },

  async getByRole(roleId: string) {
    const role = await roleRepository.findById(roleId);
    if (!role) throw AppError.notFound("Role.");

    const rolePerms = await rolePermissionRepository.findByRoleId(roleId);
    if (!rolePerms.length) return [];

    const permIds = rolePerms.map((rp) => rp.permission_id);
    const perms   = await permissionRepository.findByIds(permIds);

    logger.info("role_permissions_retrieved", { event: "role_permissions_retrieved", roleId, count: perms.length, ...ctx() });
    return perms;
  },

  async addPermissionToRole(body: unknown, requestingUserId: string, tenantId?: string) {
    const { error, value } = addPermissionToRoleSchema.validate(body, { abortEarly: false, stripUnknown: true });
    if (error) throw AppError.badRequest(error.details[0].message);

    const { roleId, permissionId } = value as { roleId: string; permissionId: string };

    const [role, perm] = await Promise.all([
      roleRepository.findById(roleId),
      permissionRepository.findById(permissionId),
    ]);

    if (!role) throw AppError.notFound("Role.");
    if (!perm) throw AppError.notFound("Permission.");
    if (role.is_system) throw AppError.forbidden("Cannot modify permissions on system roles.");

    const already = await rolePermissionRepository.exists(roleId, permissionId);
    if (already) throw AppError.conflict("Permission is already assigned to this role.");

    await rolePermissionRepository.add(roleId, permissionId);

    // Invalidate caches for all users with this role in the tenant scope
    if (tenantId) await permissionResolver.invalidateAllInTenant(tenantId);

    await auditRepository.log({
      action:     "updated",
      resource:   "role_permission",
      resourceId: roleId,
      tenantId,
      userId:     requestingUserId,
      newValue:   { permissionId, action: "added" },
    });

    logger.info("permission_added_to_role", { event: "permission_added_to_role", roleId, permissionId, ...ctx() });
  },

  async removePermissionFromRole(body: unknown, requestingUserId: string, tenantId?: string) {
    const { error, value } = removePermissionFromRoleSchema.validate(body, { abortEarly: false, stripUnknown: true });
    if (error) throw AppError.badRequest(error.details[0].message);

    const { roleId, permissionId } = value as { roleId: string; permissionId: string };

    const role = await roleRepository.findById(roleId);
    if (!role) throw AppError.notFound("Role.");
    if (role.is_system) throw AppError.forbidden("Cannot modify permissions on system roles.");

    await rolePermissionRepository.remove(roleId, permissionId);

    if (tenantId) await permissionResolver.invalidateAllInTenant(tenantId);

    await auditRepository.log({
      action:     "deleted",
      resource:   "role_permission",
      resourceId: roleId,
      tenantId,
      userId:     requestingUserId,
      newValue:   { permissionId, action: "removed" },
    });

    logger.info("permission_removed_from_role", { event: "permission_removed_from_role", roleId, permissionId, ...ctx() });
  },
};
