import { parse } from "csv-parse/sync";
import {
  createPropertyWithRooms,
  groupAndValidate,
  importBatchRepository,
  logger,
  publishImportEvent,
  validateHeaders,
  type ImportCreatedProperty,
  type ImportEvent,
  type ImportRowError,
  type ImportStage,
  type ImportTotals,
} from "@booking/shared";
import { downloadImportFile } from "./downloadImportFile";
import { ImportFailure } from "./importFailure";

export interface PropertyImportMessage {
  batchId: string;
  tenantId: string;
  userId: string;
  filePublicId: string;
}

const PROGRESS_THROTTLE_MS = 250;
const ERROR_CHUNK = 100;
const RETRYABLE_PG_CODES = new Set([
  "40001",
  "40P01",
  "57P01",
  "08000",
  "08003",
  "08006",
]);

function isRetryable(err: unknown): boolean {
  const e = err as { code?: string };
  return (
    (e?.code !== undefined && RETRYABLE_PG_CODES.has(e.code)) ||
    e?.code === "ECONNRESET" ||
    e?.code === "ETIMEDOUT"
  );
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i >= attempts || !isRetryable(err)) throw err;
      await new Promise((r) => setTimeout(r, 200 * 2 ** (i - 1)));
    }
  }
}

function decodeUtf8(buf: Buffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    throw new ImportFailure(
      'The file is not saved as UTF-8. In Excel use "Save As", then "CSV UTF-8 (Comma delimited)", and upload it again.',
    );
  }
}

function parseCsv(text: string): Record<string, string>[] {
  try {
    return parse(text, {
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
      columns: (header: string[]) => {
        const problem = validateHeaders(header);
        if (problem) throw new ImportFailure(problem);
        return header.map((h) => h.trim());
      },
    }) as Record<string, string>[];
  } catch (err) {
    if (err instanceof ImportFailure) throw err;
    const e = err as { message?: string; lines?: number };
    throw new ImportFailure(
      `The file could not be read${e.lines ? ` near line ${e.lines}` : ""}: ${e.message ?? "invalid CSV"}.`,
    );
  }
}

export async function runPropertyImport(
  m: PropertyImportMessage,
): Promise<void> {
  const { batchId, tenantId, userId } = m;

  if (!(await importBatchRepository.start(batchId))) {
    logger.info("property_import_skip_finished", {
      event: "property_import_skip_finished",
      batchId,
    });
    return;
  }

  const emit = (event: ImportEvent) => publishImportEvent(batchId, event);
  let lastProgressAt = 0;
  const stage = async (s: ImportStage, progress: number, force = false) => {
    const now = Date.now();
    if (!force && now - lastProgressAt < PROGRESS_THROTTLE_MS) return;
    lastProgressAt = now;
    await importBatchRepository.setStage(batchId, s, progress);
    await emit({ type: "stage", stage: s, progress });
  };
  const reportErrors = async (errors: ImportRowError[]) => {
    for (let i = 0; i < errors.length; i += ERROR_CHUNK) {
      const chunk = errors.slice(i, i + ERROR_CHUNK);
      await importBatchRepository.appendErrors(batchId, chunk);
      await emit({ type: "row_errors", errors: chunk });
    }
  };

  try {
    await stage("downloading", 5, true);
    const buf = await downloadImportFile(m.filePublicId, tenantId);

    await stage("validating", 15, true);
    const records = parseCsv(decodeUtf8(buf));
    const { properties, errors } = groupAndValidate(records);

    const refsInFile = new Set(
      records.map((r) => (r["property_ref"] ?? "").trim()).filter(Boolean),
    );
    const totals: ImportTotals = {
      propertiesInFile: refsInFile.size,
      roomsInFile: records.length,
      created: 0,
      skippedExisting: 0,
      failed: Math.max(0, refsInFile.size - properties.length),
    };
    await importBatchRepository.setTotals(batchId, totals);
    await reportErrors(errors);

    await stage("importing", 20, true);
    for (let i = 0; i < properties.length; i++) {
      const p = properties[i];
      try {
        const result = await withRetry(() =>
          createPropertyWithRooms({
            tenantId,
            actor: { type: "user", id: userId },
            property: p,
            importBatchId: batchId,
          }),
        );
        const created: ImportCreatedProperty = {
          ref: p.ref,
          propertyId: result.propertyId,
          rooms: result.created ? result.roomTypeIds.length : 0,
          skippedExisting: !result.created,
          missingCoordinates: p.latitude === null,
        };
        if (result.created) totals.created++;
        else totals.skippedExisting++;
        await importBatchRepository.appendCreated(batchId, created);
        await emit({ type: "property_created", property: created });
      } catch (err) {
        totals.failed++;
        logger.error("property_import_property_failed", {
          event: "property_import_property_failed",
          batchId,
          ref: p.ref,
          error: (err as Error).message,
        });
        await reportErrors([
          {
            row: p.rows[0],
            propertyRef: p.ref,
            message:
              "This property could not be saved. Send the file again; properties already imported will be skipped.",
          },
        ]);
      }
      await stage("importing", 20 + (80 * (i + 1)) / properties.length);
    }

    await importBatchRepository.complete(batchId, totals);
    await emit({ type: "completed", totals });
  } catch (err) {
    const reason =
      err instanceof ImportFailure
        ? err.message
        : "The import stopped unexpectedly. Send the file again; properties already imported will be skipped.";
    logger.error("property_import_failed", {
      event: "property_import_failed",
      batchId,
      error: (err as Error).message,
    });
    await importBatchRepository.fail(batchId, reason);
    await emit({ type: "failed", reason });
  }
}
