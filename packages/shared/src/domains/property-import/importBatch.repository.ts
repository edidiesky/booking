
import { checkoutClient, query, queryOne } from "../../config/database";
import { PROPERTY_IMPORT_LIMITS } from "./importSpec";
import type {
  ImportCreatedProperty,
  ImportRowError,
  ImportStage,
  ImportTotals,
} from "./importTypes";

export interface ImportBatchRow {
  id: string;
  tenant_id: string;
  created_by: string;
  status: ImportStage;
  file_public_id: string;
  file_name: string | null;
  progress: number;
  totals: Partial<ImportTotals>;
  errors: ImportRowError[];
  created_properties: ImportCreatedProperty[];
  failure_reason: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export const TERMINAL_STAGES: readonly ImportStage[] = ["completed", "failed"];

export const importBatchRepository = {
  async create(input: {
    tenantId: string;
    createdBy: string;
    filePublicId: string;
    fileName: string | null;
  }): Promise<ImportBatchRow> {
    const client = await checkoutClient();
    try {
      const { rows } = await client.query<ImportBatchRow>(
        `INSERT INTO import_batches (tenant_id, created_by, file_public_id, file_name)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [input.tenantId, input.createdBy, input.filePublicId, input.fileName],
      );
      return rows[0];
    } finally {
      client.release();
    }
  },

  async findForTenant(
    id: string,
    tenantId: string,
  ): Promise<ImportBatchRow | null> {
    return queryOne<ImportBatchRow>(
      `SELECT * FROM import_batches WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
  },

  async listForTenant(tenantId: string, limit = 20): Promise<ImportBatchRow[]> {
    return query<ImportBatchRow>(
      `SELECT * FROM import_batches WHERE tenant_id = $1
       ORDER BY created_at DESC, id DESC LIMIT $2`,
      [tenantId, limit],
    );
  },

  // Returns false when the batch is already past this point (redelivery).
  async start(id: string): Promise<boolean> {
    const row = await queryOne<{ id: string }>(
      `UPDATE import_batches
          SET status = 'downloading', progress = 0, started_at = COALESCE(started_at, now())
        WHERE id = $1 AND status IN ('queued', 'downloading', 'validating', 'importing')
        RETURNING id`,
      [id],
    );
    return row !== null;
  },

  async setStage(
    id: string,
    stage: ImportStage,
    progress: number,
  ): Promise<void> {
    await query(
      `UPDATE import_batches SET status = $2, progress = $3 WHERE id = $1`,
      [id, stage, Math.max(0, Math.min(100, Math.round(progress)))],
    );
  },

  async setTotals(id: string, totals: Partial<ImportTotals>): Promise<void> {
    await query(
      `UPDATE import_batches SET totals = totals || $2::jsonb WHERE id = $1`,
      [id, JSON.stringify(totals)],
    );
  },

  // Caps stored errors so one broken 2,000-row file cannot bloat the row.
  async appendErrors(id: string, errors: ImportRowError[]): Promise<void> {
    if (errors.length === 0) return;
    await query(
      `UPDATE import_batches
          SET errors = errors || (
            SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
            FROM (
              SELECT e FROM jsonb_array_elements($2::jsonb) AS e
              LIMIT GREATEST(0, $3 - jsonb_array_length(errors))
            ) capped
          )
        WHERE id = $1`,
      [id, JSON.stringify(errors), PROPERTY_IMPORT_LIMITS.maxStoredErrors],
    );
  },

  async appendCreated(
    id: string,
    created: ImportCreatedProperty,
  ): Promise<void> {
    await query(
      `UPDATE import_batches
          SET created_properties = created_properties || jsonb_build_array($2::jsonb)
        WHERE id = $1`,
      [id, JSON.stringify(created)],
    );
  },

  async complete(id: string, totals: ImportTotals): Promise<void> {
    await query(
      `UPDATE import_batches
          SET status = 'completed', progress = 100, totals = $2::jsonb, completed_at = now()
        WHERE id = $1`,
      [id, JSON.stringify(totals)],
    );
  },

  async fail(id: string, reason: string): Promise<void> {
    await query(
      `UPDATE import_batches
          SET status = 'failed', failure_reason = $2, completed_at = now()
        WHERE id = $1 AND status NOT IN ('completed', 'failed')`,
      [id, reason.slice(0, 1000)],
    );
  },
};
