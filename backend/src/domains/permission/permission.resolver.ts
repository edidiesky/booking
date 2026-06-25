import redisClient             from "../../config/redis";
import { rolePermissionRepository } from "../role/role-permission.repository";
import { userRoleRepository }  from "../user-role/user-role.repository";
import { userPermissionRepository } from "../user-permission/user-permission.repository";
import { permissionRepository } from "../permission/permission.repository";
import logger                  from "../../utils/logger";
import { requestContext }      from "../../context/requestContext";

const CACHE_PREFIX = "permissions:";
const CACHE_TTL    = 300; // 5 minutes

/**
 * Resolution order (matching your existing service exactly):
 *  1. user_roles -> roleIds
 *  2. role_permissions for roleIds -> role-level grants
 *  3. user_permissions for user+tenant -> direct overrides
 *  4. Explicit denials WIN over role-level; explicit grants ADD to role-level
 */
class PermissionResolverService {
  private cacheKey(userId: string, tenantId: string): string {
    return `${CACHE_PREFIX}${userId}:${tenantId}`;
  }

  async resolve(userId: string, tenantId: string): Promise<Set<string>> {
    const key = this.cacheKey(userId, tenantId);
    const ctx = requestContext.get() ?? {};

    // Cache hit
    try {
      const cached = await redisClient.get(key);
      if (cached) {
        logger.debug("permission_cache_hit", { event: "permission_cache_hit", userId, tenantId, ...ctx });
        return new Set(JSON.parse(cached) as string[]);
      }
    } catch (err) {
      logger.warn("permission_cache_read_failed", {
        event:  "permission_cache_read_failed",
        userId,
        tenantId,
        error:  (err as Error).message,
      });
    }

    logger.debug("permission_cache_miss", { event: "permission_cache_miss", userId, tenantId, ...ctx });

    // Step 1 - get roleIds for this user+tenant
    const roleIds = await userRoleRepository.getRoleIdsByUserId(userId, tenantId);

    // Step 2 - get role-level permission ids
    const rolePermissions = roleIds.length
      ? await rolePermissionRepository.findByRoleIds(roleIds)
      : [];

    const rolePermissionIds = rolePermissions.map((rp) => rp.permission_id);

    const rolePermDocs = rolePermissionIds.length
      ? await permissionRepository.findByIds(rolePermissionIds)
      : [];

    const roleLevelGrants = new Set<string>(
      rolePermDocs.map((p) => `${p.resource}:${p.action}`)
    );

    logger.debug("role_level_grants_resolved", {
      event:      "role_level_grants_resolved",
      userId,
      tenantId,
      roleCount:  roleIds.length,
      grantCount: roleLevelGrants.size,
    });

    // Step 3 - direct overrides
    const directOverrides = await userPermissionRepository.getPermissionIdsByUser(userId, tenantId);

    const explicitGrants  = new Set<string>();
    const explicitDenials = new Set<string>();

    if (directOverrides.length) {
      const overridePermIds = directOverrides.map((o) => o.permission_id);
      const overridePerms   = await permissionRepository.findByIds(overridePermIds);
      const permMap         = new Map(overridePerms.map((p) => [p.id, p]));

      for (const override of directOverrides) {
        const perm = permMap.get(override.permission_id);
        if (!perm) continue;
        const key = `${perm.resource}:${perm.action}`;
        if (override.granted) {
          explicitGrants.add(key);
        } else {
          explicitDenials.add(key);
        }
      }
    }

    // Step 4 - merge: role grants + explicit grants - explicit denials
    const finalGranted = new Set<string>([...roleLevelGrants, ...explicitGrants]);
    for (const denial of explicitDenials) {
      finalGranted.delete(denial);
    }

    logger.debug("permissions_resolved", {
      event:      "permissions_resolved",
      userId,
      tenantId,
      finalCount: finalGranted.size,
    });

    // Populate cache
    try {
      await redisClient.set(
        this.cacheKey(userId, tenantId),
        JSON.stringify([...finalGranted]),
        "EX",
        CACHE_TTL
      );
    } catch (err) {
      logger.warn("permission_cache_write_failed", {
        event:  "permission_cache_write_failed",
        userId,
        tenantId,
        error:  (err as Error).message,
      });
    }

    return finalGranted;
  }

  async has(userId: string, tenantId: string, resource: string, action: string): Promise<boolean> {
    const granted = await this.resolve(userId, tenantId);
    return granted.has(`${resource}:${action}`);
  }

  async invalidate(userId: string, tenantId: string): Promise<void> {
    try {
      await redisClient.del(this.cacheKey(userId, tenantId));
      logger.debug("permission_cache_invalidated", { event: "permission_cache_invalidated", userId, tenantId });
    } catch (err) {
      logger.warn("permission_cache_invalidation_failed", {
        event:    "permission_cache_invalidation_failed",
        userId,
        tenantId,
        error:    (err as Error).message,
      });
    }
  }

  async invalidateAllInTenant(tenantId: string): Promise<void> {
    try {
      const pattern = `${CACHE_PREFIX}*:${tenantId}`;
      const keys    = await redisClient.keys(pattern);
      if (keys.length) {
        await redisClient.del(...keys);
        logger.debug("tenant_permission_caches_invalidated", {
          event:    "tenant_permission_caches_invalidated",
          tenantId,
          keyCount: keys.length,
        });
      }
    } catch (err) {
      logger.warn("bulk_permission_cache_invalidation_failed", {
        event:    "bulk_permission_cache_invalidation_failed",
        tenantId,
        error:    (err as Error).message,
      });
    }
  }
}

export const permissionResolver = new PermissionResolverService();
