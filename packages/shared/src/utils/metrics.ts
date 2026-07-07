import client from "prom-client";

export const bookingRegistry = new client.Registry();
client.collectDefaultMetrics({ register: bookingRegistry });

export const httpRequestCounter = new client.Counter({
  name: "booking_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "path", "status"] as const,
  registers: [bookingRegistry],
});

export const requestDurationHistogram = new client.Histogram({
  name: "booking_request_duration_seconds",
  help: "Request duration in seconds",
  labelNames: ["method", "path", "status"] as const,
  registers: [bookingRegistry],
});

export const bookingCreatedCounter     = new client.Counter({ name: "booking_created_total",     help: "Bookings created",     labelNames: ["tenant_id"] as const,             registers: [bookingRegistry] });
export const bookingConfirmedCounter   = new client.Counter({ name: "booking_confirmed_total",    help: "Bookings confirmed",   labelNames: ["tenant_id"] as const,             registers: [bookingRegistry] });
export const bookingCancelledCounter   = new client.Counter({ name: "booking_cancelled_total",    help: "Bookings cancelled",   labelNames: ["tenant_id"] as const,             registers: [bookingRegistry] });
export const paymentInitializedCounter = new client.Counter({ name: "payment_initialized_total",  help: "Payments initialized", labelNames: ["gateway", "tenant_id"] as const,  registers: [bookingRegistry] });
export const webhookProcessedCounter   = new client.Counter({ name: "webhook_processed_total",    help: "Webhooks processed",   labelNames: ["gateway", "status"] as const,     registers: [bookingRegistry] });
export const outboxProcessedCounter    = new client.Counter({ name: "outbox_processed_total",     help: "Outbox events processed", labelNames: ["event_type", "status"] as const, registers: [bookingRegistry] });
export const escrowHeldGauge           = new client.Gauge({   name: "escrow_held_total",          help: "Current escrow held",  labelNames: ["tenant_id"] as const,             registers: [bookingRegistry] });
export const availabilityLockCounter   = new client.Counter({ name: "availability_lock_total",    help: "Availability locks",   labelNames: ["action"] as const,                registers: [bookingRegistry] });
export const circuitBreakerCounter     = new client.Counter({ name: "circuit_breaker_events_total", help: "Circuit breaker events", labelNames: ["name", "event"] as const,     registers: [bookingRegistry] });
export const idempotencyStateCounter   = new client.Counter({ name: "idempotency_state_total",    help: "Idempotency state transitions", labelNames: ["status"] as const,        registers: [bookingRegistry] });

export function trackError(errorType: string, operation: string, severity: string): void {
  errorCounter.inc({ error_type: errorType, operation, severity });
}

export const errorCounter = new client.Counter({
  name: "booking_errors_total",
  help: "Total errors",
  labelNames: ["error_type", "operation", "severity"] as const,
  registers: [bookingRegistry],
});

export function trackCircuitBreakerEvent(name: string, event: string): void {
  circuitBreakerCounter.inc({ name, event });
}