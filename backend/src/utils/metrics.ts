import { Request, Response } from "express";
import client from "prom-client";

const register = new client.Registry();
client.collectDefaultMetrics({ prefix: "booking_platform_", register });

const OP_BUCKETS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

//  HTTP
export const requestDurationHistogram = new client.Histogram({
  name: "booking_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  labelNames: ["method", "route", "status_code", "success"],
  registers: [register],
});

export const httpRequestCounter = new client.Counter({
  name: "booking_http_request_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code", "success"],
  registers: [register],
});

export const errorCounter = new client.Counter({
  name: "booking_platform_errors_total",
  help: "Total errors",
  labelNames: ["error_type", "operation", "severity"],
  registers: [register],
});

export const serverHealthGauge = new client.Gauge({
  name: "booking_platform_health_status",
  help: "Service health: 1=healthy 0=unhealthy",
  registers: [register],
});

//  Legacy business counters (keep for existing call sites)
export const bookingCreatedCounter = new client.Counter({
  name: "bookings_created_total",
  help: "Total bookings created",
  labelNames: ["tenant_id", "property_type"],
  registers: [register],
});

export const bookingConfirmedCounter = new client.Counter({
  name: "bookings_confirmed_total",
  help: "Total bookings confirmed after payment",
  labelNames: ["tenant_id"],
  registers: [register],
});

export const bookingCancelledCounter = new client.Counter({
  name: "bookings_cancelled_total",
  help: "Total bookings cancelled",
  labelNames: ["tenant_id", "reason_type"],
  registers: [register],
});

export const paymentInitializedCounter = new client.Counter({
  name: "payments_initialized_total",
  help: "Total payment initializations",
  labelNames: ["gateway", "tenant_id"],
  registers: [register],
});

export const webhookProcessedCounter = new client.Counter({
  name: "webhooks_processed_total",
  help: "Total webhooks processed",
  labelNames: ["gateway", "status"],
  registers: [register],
});

export const outboxProcessedCounter = new client.Counter({
  name: "outbox_events_processed_total",
  help: "Total outbox events processed",
  labelNames: ["event_type", "status"],
  registers: [register],
});

export const circuitBreakerCounter = new client.Counter({
  name: "booking_circuit_breaker_events_total",
  help: "Circuit breaker state transitions and outcomes",
  labelNames: ["name", "event"],
  registers: [register],
});

export const idempotencyStateCounter = new client.Counter({
  name: "booking_idempotency_state_total",
  help: "Idempotency key state transitions",
  labelNames: ["status"],
  registers: [register],
});

export const escrowHeldGauge = new client.Gauge({
  name: "escrow_held_amount_ngn",
  help: "Total amount currently held in escrow (NGN)",
  labelNames: ["tenant_id"],
  registers: [register],
});

export const availabilityLockCounter = new client.Counter({
  name: "availability_locks_total",
  help: "Total availability locks acquired/released",
  labelNames: ["action"],
  registers: [register],
});

//  Domain ops (low cardinality)
function domainPair(name: string, help: string) {
  return {
    counter: new client.Counter({
      name: `${name}_total`,
      help: `${help} (count)`,
      labelNames: ["operation", "status"],
      registers: [register],
    }),
    histogram: new client.Histogram({
      name: `${name}_duration_seconds`,
      help: `${help} (duration)`,
      labelNames: ["operation", "status"],
      buckets: OP_BUCKETS,
      registers: [register],
    }),
  };
}

const authMetrics = domainPair("booking_auth_ops", "Auth domain operations");
const bookingOpMetrics = domainPair(
  "booking_booking_ops",
  "Booking domain operations",
);
const paymentOpMetrics = domainPair(
  "booking_payment_ops",
  "Payment domain operations",
);
const escrowOpMetrics = domainPair(
  "booking_escrow_ops",
  "Escrow domain operations",
);
const availabilityOpMetrics = domainPair(
  "booking_availability_ops",
  "Availability domain operations",
);
const propertyOpMetrics = domainPair(
  "booking_property_ops",
  "Property domain operations",
);
const importOpMetrics = domainPair(
  "booking_import_ops",
  "Import domain operations",
);

export const dbQueryHistogram = new client.Histogram({
  name: "booking_db_query_duration_seconds",
  help: "Database query duration",
  labelNames: ["operation", "status"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register],
});

export const cacheCounter = new client.Counter({
  name: "booking_cache_operations_total",
  help: "Cache hit/miss",
  labelNames: ["result"],
  registers: [register],
});

//  Helpers
export function trackError(
  errorType: string,
  operation: string,
  severity: "low" | "medium" | "high" | "critical" = "medium",
): void {
  errorCounter.inc({ error_type: errorType, operation, severity });
}

export function trackCircuitBreakerEvent(name: string, event: string): void {
  circuitBreakerCounter.inc({ name, event });
}

export function reqReplyTime(
  req: Request,
  res: Response,
  startTime: [number, number],
): void {
  const [s, ns] = process.hrtime(startTime);
  const duration = s + ns / 1e9;
  const success = res.statusCode < 400 ? "true" : "false";
  const labels = {
    method: req.method,
    route: req.route?.path ?? req.url,
    status_code: String(res.statusCode),
    success,
  };
  requestDurationHistogram.observe(labels, duration);
  httpRequestCounter.inc(labels);
}

type OpMetrics = {
  counter: client.Counter<"operation" | "status">;
  histogram: client.Histogram<"operation" | "status">;
};

async function measureOp<T>(
  metrics: OpMetrics,
  operation: string,
  fn: () => Promise<T>,
  errorType?: string,
): Promise<T> {
  const start = process.hrtime.bigint();
  try {
    const result = await fn();
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    metrics.counter.inc({ operation, status: "success" });
    metrics.histogram.observe({ operation, status: "success" }, seconds);
    return result;
  } catch (err) {
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    metrics.counter.inc({ operation, status: "error" });
    metrics.histogram.observe({ operation, status: "error" }, seconds);
    trackError(errorType ?? `${operation}_failed`, operation, "high");
    throw err;
  }
}

export const measureAuthOp = <T>(op: string, fn: () => Promise<T>) =>
  measureOp(authMetrics, op, fn, `auth_${op}_failed`);
export const measureBookingOp = <T>(op: string, fn: () => Promise<T>) =>
  measureOp(bookingOpMetrics, op, fn, `booking_${op}_failed`);
export const measurePaymentOp = <T>(op: string, fn: () => Promise<T>) =>
  measureOp(paymentOpMetrics, op, fn, `payment_${op}_failed`);
export const measureEscrowOp = <T>(op: string, fn: () => Promise<T>) =>
  measureOp(escrowOpMetrics, op, fn, `escrow_${op}_failed`);
export const measureAvailabilityOp = <T>(op: string, fn: () => Promise<T>) =>
  measureOp(availabilityOpMetrics, op, fn, `availability_${op}_failed`);
export const measurePropertyOp = <T>(op: string, fn: () => Promise<T>) =>
  measureOp(propertyOpMetrics, op, fn, `property_${op}_failed`);
export const measureImportOp = <T>(op: string, fn: () => Promise<T>) =>
  measureOp(importOpMetrics, op, fn, `import_${op}_failed`);

export async function measureDatabaseQuery<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = process.hrtime.bigint();
  try {
    const result = await fn();
    dbQueryHistogram.observe(
      { operation, status: "success" },
      Number(process.hrtime.bigint() - start) / 1e9,
    );
    return result;
  } catch (err) {
    dbQueryHistogram.observe(
      { operation, status: "error" },
      Number(process.hrtime.bigint() - start) / 1e9,
    );
    trackError("db_query_failed", operation, "high");
    throw err;
  }
}

export function trackCacheHit(): void {
  cacheCounter.inc({ result: "hit" });
}
export function trackCacheMiss(): void {
  cacheCounter.inc({ result: "miss" });
}

export const bookingRegistry = register;
