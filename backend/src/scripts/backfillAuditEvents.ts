import "dotenv/config";
import { query, queryOne, connectDB, disconnectDB, logger } from "@booking/shared";
const BATCH_SIZE = 500;

interface OldAuditLogRow {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  request_id: string | null;
  created_at: Date;
}

function diffKeys(before: Record<string, unknown> | null, after: Record<string, unknown> | null): string[] {
  if (!before && !after) return [];
  const keys = new Set<string>([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return [...keys].filter((k) => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]));
}

async function run(): Promise<void> {
  await connectDB();

  let migrated = 0;
  let skippedNoTenant = 0;
  let cursor: string | null = null;

  for (;;) {
    const rows: OldAuditLogRow[] = cursor
      ? await query<OldAuditLogRow>(
          `SELECT * FROM audit_logs WHERE id > $1 ORDER BY id LIMIT $2`,
          [cursor, BATCH_SIZE],
        )
      : await query<OldAuditLogRow>(`SELECT * FROM audit_logs ORDER BY id LIMIT $1`, [BATCH_SIZE]);

    if (rows.length === 0) break;

    for (const row of rows) {
      if (!row.tenant_id) {
        skippedNoTenant++;
        continue;
      }

      const actor = row.user_id
        ? await queryOne<{ email: string; name: string }>(
            `SELECT email, name FROM users WHERE id = $1`,
            [row.user_id],
          )
        : null;

      await query(
        `INSERT INTO audit_events (
           tenant_id, actor_type, actor_id, actor_email, actor_name,
           action, target_type, target_id, outcome, changed_fields,
           before_value, after_value, origin_ip, request_id,
           occurred_at, recorded_at
         ) VALUES ($1, 'user', $2, $3, $4, $5, $6, $7, 'allowed', $8, $9::jsonb, $10::jsonb, $11, $12, $13, $13)`,
        [
          row.tenant_id,
          row.user_id,
          actor?.email ?? null,
          actor?.name ?? null,
          row.action,
          row.resource,
          row.resource_id,
          diffKeys(row.old_value, row.new_value),
          row.old_value ? JSON.stringify(row.old_value) : null,
          row.new_value ? JSON.stringify(row.new_value) : null,
          row.ip_address,
          row.request_id,
          row.created_at,
        ],
      );
      migrated++;
    }

    cursor = rows[rows.length - 1]!.id;
    logger.info("audit_backfill_batch_complete", {
      event: "audit_backfill_batch_complete", batchSize: rows.length, migratedSoFar: migrated,
    });
  }

  logger.info("audit_backfill_complete", {
    event: "audit_backfill_complete", migrated, skippedNoTenant,
  });

  await disconnectDB();
}

run().catch((err) => {
  logger.error("audit_backfill_failed", { event: "audit_backfill_failed", error: (err as Error).message });
  process.exit(1);
});