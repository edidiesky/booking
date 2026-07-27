import { Request, Response, NextFunction } from "express";
import { checkoutClient, requestContext } from "@booking/shared";
import logger from "../utils/logger";

// Shared by rlsMiddleware (subdomain-resolved public routes) and
// requireTenantMember (authenticated dashboard routes), the two places
// req.tenantId actually gets set. Checks out one client for the rest of
// the request, begins a transaction, sets app.current_tenant_id via
// SET LOCAL (scoped to that transaction only, automatically cleared on
// commit/rollback, safe to reuse the underlying physical connection for
// a totally unrelated later request with zero risk of leaking the
// setting across requests). Every subsequent query() call in this
// request routes through this same client (see database.ts), that's
// what makes RLS policies actually see the session variable instead of
// silently filtering out everything on a fresh, unset connection.
export async function beginTenantScopedTransaction(_req: Request, res: Response, tenantId: string): Promise<boolean> {
  // Idempotent: if something upstream already set this up for the same
  // request (subdomain-resolved tenantMiddleware running before an
  // authenticated requireTenantMember, for instance), reuse it rather
  // than checking out a second client, which would be wasteful and
  // would silently overwrite the first client in context, leaving its
  // transaction to finalize independently with nothing left routing
  // queries through it.
  if (requestContext.get()?.dbClient) return true;

  const client = await checkoutClient();

  try {
    await client.query("BEGIN");
    // set_config with is_local=true is the parameterized equivalent of
    // SET LOCAL, plain SET LOCAL doesn't accept $1 placeholders,
    // set_config is the correct, injection-safe mechanism for a
    // dynamic value.
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
  } catch (err) {
    client.release();
    logger.error("rls_setup_failed", { event: "rls_setup_failed", error: (err as Error).message });
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
      logger.error("rls_finalize_failed", { event: "rls_finalize_failed", commit, error: (err as Error).message });
    } finally {
      client.release();
    }
  };

  // finish fires on every response, success or error, close fires if the
  // connection drops before a response was ever sent, both need to
  // release the client, a leaked checked-out client is a real resource
  // leak against a pool capped at 20 connections.
  res.on("finish", () => { void finalize(res.statusCode < 400); });
  res.on("close",  () => { void finalize(false); });

  return true;
}

// For subdomain-resolved public routes (tenantMiddleware sets
// req.tenantId, requireTenantMember never runs for these, there's no
// authenticated user at all). Requests with no resolved tenant (the
// main marketplace domain) pass through untouched, on the plain pool,
// RLS-enabled tables simply return zero rows for those, which is
// correct, a request with no tenant context shouldn't read tenant-scoped
// data regardless of which table it asks for.
export async function rlsMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.tenantId) {
    next();
    return;
  }
  const ok = await beginTenantScopedTransaction(req, res, req.tenantId);
  if (!ok) { next(new Error("Failed to establish tenant-scoped database session.")); return; }
  next();
}