import "dotenv/config";
import { query, connectDB, disconnectDB, logger, withTransaction } from "@booking/shared";
import { roleRepository } from "../domains/role/role.repository";
import { userRoleRepository } from "../domains/user-role/user-role.repository";

const BATCH_SIZE = 500;
const REASON = "Backfilled: registration did not assign a role (fixed going forward)";

interface UserRow {
  id: string;
  user_type: string;
  tenant_id: string | null;
}

async function alreadyHasBinding(userId: string, tenantId: string | null): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM user_roles
       WHERE user_id = $1 AND tenant_id IS NOT DISTINCT FROM $2 AND is_active = true
     ) AS exists`,
    [userId, tenantId],
  );
  return rows[0]?.exists ?? false;
}

async function run(): Promise<void> {
  await connectDB();

  const roleCache = new Map<string, string>();
  let assigned = 0;
  let skippedAlreadyBound = 0;
  let skippedNoMatchingRole = 0;
  let cursor: string | null = null;

  for (;;) {
    const users: UserRow[] = cursor
      ? await query<UserRow>(
          `SELECT id, user_type, tenant_id FROM users WHERE id > $1 ORDER BY id LIMIT $2`,
          [cursor, BATCH_SIZE],
        )
      : await query<UserRow>(`SELECT id, user_type, tenant_id FROM users ORDER BY id LIMIT $1`, [BATCH_SIZE]);

    if (users.length === 0) break;

    for (const user of users) {
      if (await alreadyHasBinding(user.id, user.tenant_id)) {
        skippedAlreadyBound++;
        continue;
      }

      let roleId = roleCache.get(user.user_type);
      if (!roleId) {
        const role = await roleRepository.findBySlug(user.user_type);
        if (!role) {
          skippedNoMatchingRole++;
          logger.warn("backfill_no_matching_role", {
            event: "backfill_no_matching_role", userId: user.id, userType: user.user_type,
          });
          continue;
        }
        roleId = role.id;
        roleCache.set(user.user_type, roleId);
      }

      await withTransaction((client) =>
        userRoleRepository.assign(
          { userId: user.id, tenantId: user.tenant_id, roleId: roleId!, assignedBy: user.id, reason: REASON },
          client,
        ),
      );
      assigned++;
    }

    cursor = users[users.length - 1]!.id;
    logger.info("backfill_batch_complete", {
      event: "backfill_batch_complete", batchSize: users.length, assignedSoFar: assigned,
    });
  }

  logger.info("backfill_complete", {
    event: "backfill_complete", assigned, skippedAlreadyBound, skippedNoMatchingRole,
  });

  await disconnectDB();
}

run().catch((err) => {
  logger.error("backfill_failed", { event: "backfill_failed", error: (err as Error).message });
  process.exit(1);
});