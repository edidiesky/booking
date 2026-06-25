import { beforeEach, jest } from "@jest/globals";

const redisStore = new Map<string, string>();

//  pg
const mockClient = { query: jest.fn(), release: jest.fn() };

jest.mock("../../config/database", () => ({
  connectDB:       jest.fn(),
  disconnectDB:    jest.fn(),
  query:           jest.fn(),
  queryOne:        jest.fn(),
  withTransaction: jest.fn().mockImplementation((fn: any) => fn(mockClient) as unknown),
  default: {
    query:   jest.fn(),
    connect: jest.fn(),
    end:     jest.fn(),
    on:      jest.fn(),
  },
}));

//  Redis
jest.mock("../../config/redis", () => {
  const mock = {
    get:       jest.fn().mockImplementation((k: any) => Promise.resolve(redisStore.get(k) ?? null)),
    set:       jest.fn().mockImplementation((k: any, v: any) => { redisStore.set(k, v); return Promise.resolve("OK"); }),
    del:       jest.fn().mockImplementation((k: any) => { redisStore.delete(k); return Promise.resolve(1); }),
    setnx:     jest.fn().mockImplementation(() => Promise.resolve(1)),
    expire:    jest.fn().mockImplementation(() => Promise.resolve(1)),
    publish:   jest.fn().mockImplementation(() => Promise.resolve(1)),
    subscribe: jest.fn().mockImplementation(() => Promise.resolve()),
    duplicate: jest.fn().mockReturnThis(),
    ping:      jest.fn().mockImplementation(() => Promise.resolve("PONG")),
    quit:      jest.fn().mockImplementation(() => Promise.resolve()),
    on:        jest.fn(),
    status:    "ready",
  };
  return { __esModule: true, default: mock };
});
//  RabbitMQ
const mockChannel = {
  publish: jest.fn(),
  assertQueue: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ queue: "test-q" })),
  bindQueue: jest.fn().mockImplementation(() => Promise.resolve()),
  consume: jest.fn().mockImplementation(() => Promise.resolve()),
  prefetch: jest.fn().mockImplementation(() => Promise.resolve()),
  assertExchange: jest.fn().mockImplementation(() => Promise.resolve()),
};

jest.mock("../../messaging/connection", () => ({
  connectRabbitMQ: jest.fn().mockImplementation(() => Promise.resolve()),
  disconnectRabbitMQ: jest.fn().mockImplementation(() => Promise.resolve()),
  getRabbitMQChannel: jest.fn().mockReturnValue(mockChannel),
  getRabbitMQConnection: jest.fn().mockReturnValue({
    createChannel: jest
      .fn()
      .mockImplementation(() => Promise.resolve(mockChannel)),
  }),
  EXCHANGES: {
    BOOKING: "booking.events",
    PAYMENT: "payment.events",
    NOTIFICATION: "notification.events",
  },
  ROUTING_KEYS: {
    BOOKING_CREATED: "booking.created",
    BOOKING_CONFIRMED: "booking.confirmed",
    BOOKING_CANCELLED: "booking.cancelled",
    BOOKING_CHECKED_IN: "booking.checked_in",
    BOOKING_CHECKED_OUT: "booking.checked_out",
    PAYMENT_CONFIRMED: "payment.confirmed",
    PAYMENT_FAILED: "payment.failed",
    PAYMENT_INITIATED: "payment.initiated",
    ESCROW_RELEASED: "escrow.released",
    ESCROW_REFUNDED: "escrow.refunded",
    NOTIFICATION_EMAIL: "notification.email",
  },
}));

//  OTel
jest.mock("../../utils/otel", () => ({ __esModule: true, default: {} }));

//  Outbox
jest.mock("../../domains/outbox/outbox.repository", () => ({
  outboxRepository: {
    create: jest.fn().mockImplementation(() => Promise.resolve({})),
    getPending: jest.fn().mockImplementation(() => Promise.resolve([])),
    markProcessed: jest.fn().mockImplementation(() => Promise.resolve()),
    incrementRetry: jest.fn().mockImplementation(() => Promise.resolve()),
  },
}));

//  Audit
jest.mock("../../domains/audit/audit.repository", () => ({
  auditRepository: {
    log: jest.fn().mockImplementation(() => Promise.resolve()),
    listByTenant: jest.fn().mockImplementation(() => Promise.resolve([])),
    listByUser: jest.fn().mockImplementation(() => Promise.resolve([])),
  },
}));

//  SSE
jest.mock("../../domains/sse/sse.service", () => {
  const svc = {
    pushToUser: jest.fn().mockImplementation(() => Promise.resolve()),
    pushToTenant: jest.fn().mockImplementation(() => Promise.resolve()),
  };
  const mgr = {
    addConnection: jest.fn(),
    removeConnection: jest.fn(),
    pushToUser: jest.fn().mockImplementation(() => Promise.resolve()),
    pushToTenant: jest.fn().mockImplementation(() => Promise.resolve()),
    getConnectionCount: jest.fn().mockReturnValue(0),
  };
  return {
    sseService: svc,
    sseManager: mgr,
  };
});

//  Publisher
jest.mock("../../messaging/publisher", () => ({
  publishBookingCreated: jest.fn(),
  publishBookingConfirmed: jest.fn(),
  publishBookingCancelled: jest.fn(),
  publishBookingCheckedIn: jest.fn(),
  publishBookingCheckedOut: jest.fn(),
  publishPaymentConfirmed: jest.fn(),
  publishPaymentFailed: jest.fn(),
  publishPaymentInitiated: jest.fn(),
  publishEscrowReleased: jest.fn(),
  publishEscrowRefunded: jest.fn(),
}));

//  Workers
jest.mock("../../messaging/outboxPoller", () => ({
  startOutboxPoller: jest.fn(),
  stopOutboxPoller: jest.fn(),
}));
jest.mock("../../messaging/workers/sseFanoutWorker", () => ({
  startSseFanoutWorker: jest.fn().mockImplementation(() => Promise.resolve()),
}));
jest.mock("../../messaging/workers/notificationWorker", () => ({
  startNotificationWorker: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
}));
jest.mock("../../messaging/workers/webhookRetryWorker", () => ({
  startWebhookRetryWorker: jest.fn(),
  stopWebhookRetryWorker: jest.fn(),
}));

//  Between tests
beforeEach(() => {
  redisStore.clear();
  jest.clearAllMocks();
  // Re-wire client mock after clearAllMocks
  mockClient.query.mockImplementation(() => Promise.resolve({ rows: [] }));
  mockClient.release.mockImplementation(() => undefined);
});

export { redisStore, mockClient };
