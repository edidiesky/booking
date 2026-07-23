import { roleRepository }        from "../role/role.repository";
import { permissionRepository }  from "../permission/permission.repository";
import { rolePermissionRepository } from "../role/role-permission.repository";
import {
  ROLE_SEED,
  PERMISSION_SEED,
  ROLE_PERMISSION_SEED,
} from "../role/role.constants";
import logger  from "../../utils/logger";
import redisClient from "../../config/redis";

class SeedService {
  async seedAll(): Promise<void> {
    logger.info("seed_started", { event: "seed_started" });

    // Step 1 - roles
    await roleRepository.seed(ROLE_SEED);

    // Step 2 - permissions
    await permissionRepository.seed(PERMISSION_SEED);

    // Step 3 - resolve IDs then seed role_permissions
    const [allRoles, allPerms] = await Promise.all([
      roleRepository.findAllSystem(),
      permissionRepository.findAll(),
    ]);

    const roleMap = new Map(allRoles.map((r) => [r.slug, r.id]));
    const permMap = new Map(allPerms.map((p) => [`${p.resource}:${p.action}`, p.id]));

    const records: { role_id: string; permission_id: string }[] = [];
    for (const rp of ROLE_PERMISSION_SEED) {
      const roleId = roleMap.get(rp.role_slug);
      const permId = permMap.get(`${rp.resource}:${rp.action}`);
      if (roleId && permId) records.push({ role_id: roleId, permission_id: permId });
    }

    await rolePermissionRepository.seed(records);

    // Clear all permission caches
    try {
      const keys = await redisClient.keys("permissions:*");
      if (keys.length) {
        await redisClient.del(...keys);
        logger.info("permission_caches_cleared_after_seed", { event: "permission_caches_cleared_after_seed", keyCount: keys.length });
      }
    } catch (err) {
      logger.warn("seed_cache_clear_failed", { event: "seed_cache_clear_failed", error: (err as Error).message });
    }

    logger.info("seed_completed", {
      event:       "seed_completed",
      roles:       ROLE_SEED.length,
      permissions: PERMISSION_SEED.length,
      rolePerms:   records.length,
    });
  }
}

export const seedService = new SeedService();