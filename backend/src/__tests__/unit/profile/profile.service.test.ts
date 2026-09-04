/**
 * src/__tests__/unit/profile/profile.service.test.ts
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  profileService,
  type UpdateProfileInput,
} from "../../../domains/profile/profile.service";
import {
  profileRepository,
  type Profile,
} from "../../../domains/profile/profile.repository";
import { auditRepository } from "../../../domains/audit/audit.repository";
import { expectAppError } from "../../helpers/expectAppError";

jest.mock("../../../domains/profile/profile.repository");
jest.mock("../../../domains/audit/audit.repository", () => ({
  auditRepository: {
    log: jest.fn().mockResolvedValue(undefined as never),
  },
}));

const mockedProfileRepo = profileRepository as jest.Mocked<
  typeof profileRepository
>;
const mockedAuditRepo = auditRepository as jest.Mocked<typeof auditRepository>;

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "profile-1",
    user_id: "user-1",
    display_name: "Jane Doe",
    bio: null,
    avatar_url: null,
    job_title: null,
    phone: null,
    tax_id: null,
    tax_id_verified_at: null,
    identity_verified_at: null,
    address: {},
    preferences: {},
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe("profileService", () => {
  beforeEach(() => {jest.clearAllMocks()});

  it("returns existing profile", async () => {
    mockedProfileRepo.findByUserId.mockResolvedValue(
      makeProfile({ bio: "Host" }) as never,
    );
    const result = await profileService.getMyProfile("user-1");
    expect(result.displayName).toBe("Jane Doe");
    expect(result.bio).toBe("Host");
    expect(mockedProfileRepo.create).not.toHaveBeenCalled();
  });

  it("auto-creates when missing", async () => {
    mockedProfileRepo.findByUserId.mockResolvedValue(null as never);
    mockedProfileRepo.create.mockResolvedValue(makeProfile() as never);
    const result = await profileService.getMyProfile("user-1");
    expect(mockedProfileRepo.create).toHaveBeenCalledWith({
      userId: "user-1",
    });
    expect(result.userId).toBe("user-1");
  });

  it("updates and audits", async () => {
    const input: UpdateProfileInput = {
      displayName: "Jane Updated",
      bio: "New bio",
      phone: "+2348012345678",
    };
    mockedProfileRepo.update.mockResolvedValue(
      makeProfile({
        display_name: "Jane Updated",
        bio: "New bio",
        phone: "+2348012345678",
      }) as never,
    );
    const result = await profileService.updateMyProfile("user-1", input);
    expect(result.displayName).toBe("Jane Updated");
    expect(mockedAuditRepo.log).toHaveBeenCalled();
  });

  it("throws when profile not found on update", async () => {
    mockedProfileRepo.update.mockResolvedValue(null as never);
    await expectAppError(
      profileService.updateMyProfile("missing", { displayName: "X" }),
      404,
      /Profile not found/i,
    );
  });
});