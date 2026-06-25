import { Request, Response } from "express";
import client from "prom-client";

const register = new client.Registry();
client.collectDefaultMetrics({ prefix: "booking_platform_", register });

// HTTP metrics
export const requestDurationHistogram = new client.Histogram({
  name:       "booking_http_request_duration_seconds",
  help:       "HTTP request duration in seconds",
  buckets:    [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  labelNames: ["method", "route", "status_code", "success"],
  registers:  [register],
});

export const httpRequestCounter = new client.Counter({
  name:       "booking_http_request_total",
  help:       "Total HTTP requests",
  labelNames: ["method", "route", "status_code", "success"],
  registers:  [register],
});

export const errorCounter = new client.Counter({
  name:       "booking_platform_errors_total",
  help:       "Total errors",
  labelNames: ["error_type", "operation", "severity"],
  registers:  [register],
});

export const serverHealthGauge = new client.Gauge({
  name:      "booking_platform_health_status",
  help:      "Service health: 1=healthy 0=unhealthy",
  registers: [register],
});

// Domain-specific counters
export const bookingCreatedCounter = new client.Counter({
  name:       "bookings_created_total",
  help:       "Total bookings created",
  labelNames: ["tenant_id", "property_type"],
  registers:  [register],
});

export const bookingConfirmedCounter = new client.Counter({
  name:       "bookings_confirmed_total",
  help:       "Total bookings confirmed after payment",
  labelNames: ["tenant_id"],
  registers:  [register],
});

export const bookingCancelledCounter = new client.Counter({
  name:       "bookings_cancelled_total",
  help:       "Total bookings cancelled",
  labelNames: ["tenant_id", "reason_type"],
  registers:  [register],
});

export const paymentInitializedCounter = new client.Counter({
  name:       "payments_initialized_total",
  help:       "Total payment initializations",
  labelNames: ["gateway", "tenant_id"],
  registers:  [register],
});

export const webhookProcessedCounter = new client.Counter({
  name:       "webhooks_processed_total",
  help:       "Total webhooks processed",
  labelNames: ["gateway", "status"],
  registers:  [register],
});

export const outboxProcessedCounter = new client.Counter({
  name:       "outbox_events_processed_total",
  help:       "Total outbox events processed",
  labelNames: ["event_type", "status"],
  registers:  [register],
});

export const escrowHeldGauge = new client.Gauge({
  name:       "escrow_held_amount_ngn",
  help:       "Total amount currently held in escrow (NGN)",
  labelNames: ["tenant_id"],
  registers:  [register],
});

export const availabilityLockCounter = new client.Counter({
  name:       "availability_locks_total",
  help:       "Total availability locks acquired/released",
  labelNames: ["action"],
  registers:  [register],
});

// Helpers matching your existing pattern exactly
export function trackError(
  errorType: string,
  operation: string,
  severity:  "low" | "medium" | "high" | "critical" = "medium"
): void {
  errorCounter.inc({ error_type: errorType, operation, severity });
}

export function reqReplyTime(
  req:       Request,
  res:       Response,
  startTime: [number, number]
): void {
  const [s, ns]  = process.hrtime(startTime);
  const duration = s + ns / 1e9;
  const success  = res.statusCode < 400 ? "true" : "false";
  const labels   = {
    method:      req.method,
    route:       req.route?.path ?? req.url,
    status_code: String(res.statusCode),
    success,
  };
  requestDurationHistogram.observe(labels, duration);
  httpRequestCounter.inc(labels);
}

export const bookingRegistry = register;
