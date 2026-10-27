import { Request, Response, NextFunction } from "express";
import { checkoutClient, requestContext } from "@booking/shared";
import logger from "../utils/logger";

/**
 * Request-scoped DB transaction + SET LOCAL RLS vars.
 * Use only on short request/response routes (host dashboard).
 * Do NOT use on SSE / long-lived connections.
 */
export async function beginTenantScopedTransaction(
  _req: Request,
  res: Response,
  tenantId: string,
  userId?: string | null,
): Promise<boolean> {
  if (requestContext.get()?.dbClient) {
    const client = requestContext.get()!.dbClient!;
    try {
      await client.query(
        `SELECT set_config('app.current_tenant_id', $1, true)`,
        [tenantId],
      );
      if (userId) {
        await client.query(
          `SELECT set_config('app.current_user_id', $1, true)`,
          [userId],
        );
      }
    } catch (err) {
      logger.error("rls_setup_failed", {
        event: "rls_setup_failed",
        error: (err as Error).message,
      });
      return false;
    }
    return true;
  }

  const client = await checkoutClient();

  try {
    await client.query("BEGIN");
    await client.query(
      `SELECT set_config('app.current_tenant_id', $1, true)`,
      [tenantId],
    );
    if (userId) {
      await client.query(
        `SELECT set_config('app.current_user_id', $1, true)`,
        [userId],
      );
    }
  } catch (err) {
    client.release();
    logger.error("rls_setup_failed", {
      event: "rls_setup_failed",
      error: (err as Error).message,
    });
    return false;
  }

  requestContext.set({ dbClient: client });

  let finished = false;
  const finalize = async (commit: boolean) => {
    if (finished) return;
    finished = true;
    try {
      await client.query(commit ? "COMMIT" : "ROLLBACK");
    } catch (err) {
      logger.error("rls_finalize_failed", {
        event: "rls_finalize_failed",
        commit,
        error: (err as Error).message,
      });
    } finally {
      client.release();
    }
  };

  res.on("finish", () => {
    void finalize(res.statusCode < 400);
  });
  res.on("close", () => {
    void finalize(false);
  });

  return true;
}

export async function rlsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.tenantId) {
    next();
    return;
  }
  const ok = await beginTenantScopedTransaction(
    req,
    res,
    req.tenantId,
    req.user?.userId,
  );
  if (!ok) {
    next(new Error("Failed to establish tenant-scoped database session."));
    return;
  }
  next();
}