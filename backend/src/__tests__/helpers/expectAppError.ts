
import { expect } from "@jest/globals";

/**
 * Typed rejection helper for AppError-style throws.
 */
export async function expectAppError(
  promise: Promise<unknown>,
  statusCode: number,
  messagePattern?: RegExp,
): Promise<void> {
  try {
    await promise;
    throw new Error(    
      `Expected promise to reject with statusCode ${statusCode}, but it resolved`,
    );
  } catch (err) {
    const error = err as {
      statusCode?: number;
      message?: string;
      name?: string;
    };
    if (
      error.message?.startsWith("Expected promise to reject") &&
      error.statusCode === undefined
    ) {
      throw err;
    }
    expect(error.statusCode).toBe(statusCode);
    if (messagePattern && error.message) {
      expect(error.message).toMatch(messagePattern);
    }
  }
}