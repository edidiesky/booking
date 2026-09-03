import { checkoutClient, requestContext } from "@booking/shared";
import logger from "../utils/logger";

interface SocketScopeCtx {
  userId: string;
  tenantId?: string; // absent for guests, see comment below
  userType: string;
  eventType: string;
}

/**
 * steps
 * 1. it enforces RLS policy for only tenants
 * 2. it uses a unique communication pattern to scope the RLS rather than using http
 * 3. the transaction client connection is hsort llived since if it long lived it will lead to connection poll exhaustion at scale.
 * 4. 
 * @param ctx 
 * @param handler 
 * @returns 
 */
export async function withSocketScope<T>(
  ctx: SocketScopeCtx,
  handler: () => Promise<T>,
): Promise<T> {
  if (!ctx.tenantId) {
    return new Promise<T>((resolve, reject) => {
      requestContext.run(
        {
          requestId: `socket-${ctx.eventType}-${Date.now()}`,
          userId: ctx.userId,
          userType: ctx.userType,
          eventType: ctx.eventType,
        },
        () => {
          handler().then(resolve).catch(reject);
        },
      );
    });
  }

  const client = await checkoutClient();

  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [
      ctx.tenantId,
    ]);
  } catch (err) {
    client.release();
    logger.error("socket_rls_setup_failed", {
      event: "socket_rls_setup_failed",
      error: (err as Error).message,
    });
    throw err;
  }

  return new Promise<T>((resolve, reject) => {
    requestContext.run(
      {
        requestId: `socket-${ctx.eventType}-${Date.now()}`,
        userId: ctx.userId,
        tenantId: ctx.tenantId,
        userType: ctx.userType,
        eventType: ctx.eventType,
        dbClient: client,
      },
      () => {
        handler()
          .then(async (result) => {
            await client.query("COMMIT");
            client.release();
            resolve(result);
          })
          .catch(async (err) => {
            try {
              await client.query("ROLLBACK");
            } catch (rollbackErr) {
              logger.error("socket_rls_rollback_failed", {
                event: "socket_rls_rollback_failed",
                error: (rollbackErr as Error).message,
              });
            } finally {
              client.release();
            }
            reject(err);
          });
      },
    );
  });
}