import crypto from "crypto";
import bcrypt from "bcryptjs";
import { withTransaction, AppError } from "@booking/shared";
import redisClient from "../../config/redis";
import { invitationRepository } from "./invitation.repository";
import { roleRepository } from "../role/role.repository";
import { tenantRepository } from "../tenant/tenant.repository";
import { userRepository } from "../auth/auth.repository";
import { profileRepository } from "../profile/profile.repository";
import { auditRepository } from "../audit/audit.repository";
import { getDispatcher } from "../../infra/providers/notification.dispatcher";
import { authService, AuthTokens } from "../auth/auth.service";
import { requestContext } from "../../context/requestContext";
import logger from "../../utils/logger";

const INVITE_TTL_SEC = 24 * 60 * 60; // 24h
const MAX_ATTEMPTS = 5;

function inviteKey(email: string): string {
  return `invite:${email.toLowerCase().trim()}`;
}

function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

interface InviteState {
  codeHash:  string;
  tenantId:  string;
  roleId:    string;
  invitedBy: string;
  attempts:  number;
}

function ctx() { return requestContext.get() ?? {}; }

export const invitationService = {
  async create(tenantId: string, invitedBy: string, body: unknown) {
    const { email, roleId } = body as { email?: string; roleId?: string };
    if (!email?.trim()) throw AppError.badRequest("Email is required.");
    if (!roleId) throw AppError.badRequest("A role is required, an invite grants a specific role, not a choice of one.");

    const role = await roleRepository.findById(roleId);
    if (!role || (role.tenant_id !== null && role.tenant_id !== tenantId)) {
      throw AppError.badRequest("Invalid role for this tenant.");
    }

    const tenant = await tenantRepository.findById(tenantId);
    if (!tenant) throw AppError.notFound("Tenant.");

    const normalizedEmail = email.toLowerCase().trim();
    const key = inviteKey(normalizedEmail);

    if (await redisClient.get(key)) {
      throw AppError.conflict("An invitation to this email is already pending.");
    }
    const existingPending = await invitationRepository.findPendingByTenantAndEmail(tenantId, normalizedEmail);
    if (existingPending) throw AppError.conflict("An invitation to this email is already pending.");

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, 10); // hashhing the code for security
    const expiresAt = new Date(Date.now() + INVITE_TTL_SEC * 1000);
    const state: InviteState = { codeHash, tenantId, roleId, invitedBy, attempts: 0 };
    
    await redisClient.set(key, JSON.stringify(state), "EX", INVITE_TTL_SEC);
    await invitationRepository.create({ tenantId, roleId, email: normalizedEmail, codeHash, invitedBy, expiresAt });

    const dispatcher = getDispatcher();
    await dispatcher.sendEmail(
      normalizedEmail,
      `You've been invited to join ${tenant.name}`,
      `<p>You've been invited to join <b>${tenant.name}</b> as ${role.name}.</p>
       <p>Your invitation code is: <b style="font-size:20px;letter-spacing:2px">${code}</b></p>
       <p>Enter this code at sign-up to join. It expires in 24 hours.</p>`,
    ).catch((err) => {
      logger.error("invitation_email_failed", { event: "invitation_email_failed", email: normalizedEmail, error: (err as Error).message });
    });

    await auditRepository.log({ action: "created", resource: "invitation", tenantId, userId: invitedBy });
    logger.info("invitation_created", { event: "invitation_created", tenantId, roleId, ...ctx() });

    return { message: "Invitation sent.", expiresInSeconds: INVITE_TTL_SEC };
  },

  async accept(body: unknown): Promise<AuthTokens> {
    const { email, code, firstName, lastName, phone, password } = body as {
      email?: string; code?: string; firstName?: string; lastName?: string; phone?: string; password?: string;
    };
    if (!email?.trim() || !code?.trim()) throw AppError.badRequest("Email and invitation code are required.");
    if (!firstName?.trim() || !lastName?.trim()) throw AppError.badRequest("First and last name are required.");

    const normalizedEmail = email.toLowerCase().trim();
    const key = inviteKey(normalizedEmail);
    const raw = await redisClient.get(key);
    if (!raw) throw AppError.badRequest("No pending invitation for this email, ask for a new one.");

    const state = JSON.parse(raw) as InviteState;
    if (state.attempts >= MAX_ATTEMPTS) {
      await redisClient.del(key);
      throw AppError.tooManyRequests("Too many incorrect attempts, ask for a new invitation.");
    }

    const valid = await bcrypt.compare(code, state.codeHash);
    if (!valid) {
      const ttl = await redisClient.ttl(key);
      await redisClient.set(key, JSON.stringify({ ...state, attempts: state.attempts + 1 }), "EX", ttl > 0 ? ttl : INVITE_TTL_SEC);
      throw AppError.unauthorized("Incorrect invitation code.");
    }

    let userId!: string;

    await withTransaction(async (client) => {
      // A person already having a guest account and being invited to
      // join a host team as staff is a real case, link the existing
      // account rather than error or create a duplicate.
      const existing = await userRepository.findByEmail(normalizedEmail, client);

      if (existing) {
        userId = existing.id;
      } else {
        if (!password || password.length < 8) throw AppError.badRequest("Password must be at least 8 characters.");
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await userRepository.create(
          { email: normalizedEmail, passwordHash, userType: "host:staff", firstName: firstName.trim(), lastName: lastName.trim(), phone },
          client,
        );
        userId = user.id;
        await userRepository.updateById(userId, { status: "active", is_email_verified: true }, client);
        await profileRepository.create({ userId, displayName: `${firstName} ${lastName}`.trim() }, client);
      }

      await client.query(
        `INSERT INTO user_roles (user_id, tenant_id, role_id, assigned_by, reason)
         VALUES ($1, $2, $3, 'invitation', 'Accepted team invitation')
         ON CONFLICT (user_id, tenant_id) DO UPDATE SET role_id = EXCLUDED.role_id, is_active = true, updated_at = now()`,
        [userId, state.tenantId, state.roleId],
      );
    });

    await redisClient.del(key);
    await invitationRepository.markAccepted(state.tenantId, normalizedEmail, userId);
    await auditRepository.log({ action: "updated", resource: "invitation_accepted", tenantId: state.tenantId, userId });
    logger.info("invitation_accepted", { event: "invitation_accepted", tenantId: state.tenantId, userId });

    return authService._buildTokens(userId, "host:staff", `${firstName} ${lastName}`.trim(), state.tenantId);
  },

  async list(tenantId: string) {
    return invitationRepository.listByTenant(tenantId);
  },

  async revoke(tenantId: string, email: string, revokedBy: string): Promise<void> {
    const key = inviteKey(email);
    const raw = await redisClient.get(key);
    if (raw) {
      const state = JSON.parse(raw) as InviteState;
      if (state.tenantId !== tenantId) throw AppError.forbidden("This invitation does not belong to your tenant.");
      await redisClient.del(key);
    }
    await invitationRepository.markRevoked(tenantId, email);
    await auditRepository.log({ action: "updated", resource: "invitation_revoked", tenantId, userId: revokedBy });
  },
};