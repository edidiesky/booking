import { jest } from "@jest/globals";

jest.mock("../../../messaging/publisher", () => ({
  publishBookingCreated:   jest.fn(),
  publishBookingConfirmed: jest.fn(),
  publishBookingCancelled: jest.fn(),
  publishPaymentConfirmed: jest.fn(),
  publishPaymentFailed:    jest.fn(),
  publishEscrowReleased:   jest.fn(),
  publishEscrowRefunded:   jest.fn(),
}));

jest.mock("../../../domains/outbox/outbox.repository", () => ({
  outboxRepository: { create: jest.fn<()=> Promise<unknown>>().mockResolvedValue({}) },
}));