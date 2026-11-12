import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import {
  TERMINAL_STAGES,
  importBatchRepository,
  logger,
  subscribeImportEvents,
  type ImportEvent,
} from "@booking/shared";
import { AppError } from "../../utils/AppError";
import { propertyImportService, toSnapshot } from "./propertyImport.service";

// Must stay below the gateway's 30s axios timeout, which in Node is an idle
// socket timeout: a stream silent for 30s would be cut by the gateway.
const HEARTBEAT_MS = 15_000;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const CreateUploadSignatureHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const data = propertyImportService.createUploadSignature(req.tenantId);
    res.status(200).json({ success: true, data });
  },
);

export const StartImportHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const { filePublicId, fileName } = req.body as {
      filePublicId: string;
      fileName?: string;
    };
    const data = await propertyImportService.startImport({
      tenantId: req.tenantId,
      userId: req.user.userId,
      filePublicId,
      fileName,
    });
    res.status(202).json({ success: true, data });
  },
);

export const GetImportHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const data = await propertyImportService.getImport(
      req.tenantId,
      req.params["batchId"] as string,
    );
    res.status(200).json({ success: true, data });
  },
);

export const ListImportsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const data = await propertyImportService.listImports(req.tenantId);
    res.status(200).json({ success: true, data });
  },
);

/**
 * Live import progress over SSE.
 */
export async function StreamImportHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const user = req.user;
  const tenantId = user?.tenantId;
  if (!user || !tenantId || !user.userType.startsWith("host:")) {
    res.status(403).json({ success: false, message: "Host access required." });
    return;
  }
  const batchId = req.params["batchId"] as string;
  if (!UUID_RE.test(batchId)) {
    res.status(400).json({ success: false, message: "Invalid import id." });
    return;
  }

  let closed = false;
  let ready = false;
  const buffered: ImportEvent[] = [];
  let heartbeat: NodeJS.Timeout | null = null;
  let unsubscribe: (() => Promise<void>) | null = null;

  const cleanup = async () => {
    if (closed) return;
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    if (unsubscribe) await unsubscribe().catch(() => undefined);
  };
  const write = (event: string, data: unknown) => {
    if (!closed)
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const forward = (e: ImportEvent) => {
    write(e.type, e);
    if (e.type === "completed" || e.type === "failed") {
      void cleanup().then(() => res.end());
    }
  };

  try {
    unsubscribe = await subscribeImportEvents(batchId, (e) => {
      if (ready) forward(e);
      else buffered.push(e);
    });

    const batch = await importBatchRepository.findForTenant(batchId, tenantId);
    if (!batch) {
      await cleanup();
      res.status(404).json({ success: false, message: "Import not found." });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    write("snapshot", toSnapshot(batch));
    if (TERMINAL_STAGES.includes(batch.status)) {
      await cleanup();
      res.end();
      return;
    }

    ready = true;
    for (const e of buffered.splice(0)) forward(e);

    heartbeat = setInterval(() => {
      if (!closed) res.write(": heartbeat\n\n");
    }, HEARTBEAT_MS);
    req.on("close", () => void cleanup());
  } catch (err) {
    logger.error("property_import_stream_failed", {
      event: "property_import_stream_failed",
      batchId,
      error: (err as Error).message,
    });
    await cleanup();
    if (!res.headersSent) {
      res
        .status(503)
        .json({ success: false, message: "Live updates are unavailable." });
    } else {
      res.end();
    }
  }
}
