import { AppError } from "../../utils/AppError";
import { auditRepository } from "../audit/audit.repository";
import { profileRepository, type Profile } from "./profile.repository";

export type UpdateProfileInput = {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  jobTitle?: string;
  phone?: string;
  taxId?: string;
  address?: Record<string, string>;
  preferences?: Record<string, unknown>;
};

function toPublic(profile: Profile) {
  return {
    userId:              profile.user_id,
    displayName:         profile.display_name ?? "",
    bio:                 profile.bio ?? undefined,
    avatarUrl:           profile.avatar_url ?? undefined,
    jobTitle:            profile.job_title ?? undefined,
    phone:               profile.phone ?? undefined,
    taxId:               profile.tax_id ?? undefined,
    taxIdVerifiedAt:     profile.tax_id_verified_at ?? null,
    identityVerifiedAt:  profile.identity_verified_at ?? null,
    address:             profile.address ?? {},
    preferences:         profile.preferences ?? {},
    updatedAt:           profile.updated_at,
  };
}

export const profileService = {
  async getMyProfile(userId: string) {
    let profile = await profileRepository.findByUserId(userId);
    if (!profile) {
      profile = await profileRepository.create({ userId });
    }
    return toPublic(profile);
  },

  async updateMyProfile(userId: string, body: UpdateProfileInput) {
    const updated = await profileRepository.update(userId, {
      display_name: body.displayName,
      bio:          body.bio,
      avatar_url:   body.avatarUrl,
      job_title:    body.jobTitle,
      phone:        body.phone,
      tax_id:       body.taxId,
      address:      body.address,
      preferences:  body.preferences,
    });

    if (!updated) throw AppError.notFound("Profile not found.");

    await auditRepository.log({
      action:     "updated",
      resource:   "profile",
      resourceId: userId,
      userId,
      newValue:   body as Record<string, unknown>,
    });

    return toPublic(updated);
  },
};