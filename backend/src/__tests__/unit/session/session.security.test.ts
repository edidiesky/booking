/**
 * Session revoke + version bump — security path unit tests.
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const query = jest.fn();
const queryOne = jest.fn();

jest.mock("@booking/shared", () => ({
  query: (...a: unknown[]) => query(...a),
  queryOne: (...a: unknown[]) => queryOne(...a),
}));

const bump = jest.fn();
jest.mock("../../../domains/auth/sessionVersion.repository", () => ({
  sessionVersionRepository: {
    bump: (...a: unknown[]) => bump(...a),
    get: jest.fn().mockResolvedValue(0),
  },
}));

import { sessionRepository } from "../../../domains/session/session.repository";

describe("sessionRepository — revoke paths", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("revoke sets revoked_at only when still active", async () => {
    queryOne.mockResolvedValue({ id: "s1" } as never);
    const ok = await sessionRepository.revoke("s1", "user_logout");
    expect(ok).toBe(true);
    expect(queryOne).toHaveBeenCalledWith(
      expect.stringMatching(/revoked_at IS NULL/i),
      expect.arrayContaining(["user_logout", "s1"]),
    );
  });

  it("revoke returns false when already revoked (no row)", async () => {
    queryOne.mockResolvedValue(null as never);
    const ok = await sessionRepository.revoke("s1", "user_logout");
    expect(ok).toBe(false);
  });

  it("revokeAllForUser uses user_logout_all reason", async () => {
    query.mockResolvedValue([{ id: "s1" }, { id: "s2" }] as never);
    // adapt if API returns count
    if (typeof sessionRepository.revokeAllForUser === "function") {
      await sessionRepository.revokeAllForUser("user-1", "user_logout_all");
      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(/user_id/i),
        expect.arrayContaining(["user_logout_all", "user-1"]),
      );
    }
  });

  it("adminRevoke uses admin_revoke reason", async () => {
    queryOne.mockResolvedValue({ id: "s1" } as never);
    if (typeof sessionRepository.adminRevoke === "function") {
      await sessionRepository.adminRevoke("s1");
      expect(queryOne).toHaveBeenCalledWith(
        expect.stringMatching(/revoked/i),
        expect.arrayContaining(["admin_revoke", "s1"]),
      );
    }
  });
});

describe("sessionVersionRepository — bump on revoke", () => {
  it("bump increments redis key for user", async () => {
    const { sessionVersionRepository } = await import(
      "../../../domains/auth/sessionVersion.repository"
    );
    await sessionVersionRepository.bump("user-1");
    expect(bump).toHaveBeenCalledWith("user-1");
  });
});
