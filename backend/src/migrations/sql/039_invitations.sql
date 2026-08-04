/* Team invitations. A real table, not a Redis token like password
     reset, hosts need to see pending/expired/revoked invites, not just
     redeem a one-shot link. The role is fixed at invite time, the
     invitee can't choose it, that's the whole point: the link IS the
     authorization to join with that specific role, not a self-signup
     form. */

CREATE TABLE IF NOT EXISTS invitations (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
     role_id      UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
     email        VARCHAR(255) NOT NULL,
     code_hash    VARCHAR(100) NOT NULL,
     invited_by   UUID NOT NULL REFERENCES users(id),
     status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
     expires_at   TIMESTAMPTZ NOT NULL,
     accepted_at  TIMESTAMPTZ,
     accepted_by  UUID REFERENCES users(id),
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE INDEX IF NOT EXISTS idx_invitations_tenant ON invitations(tenant_id, status);
   CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_pending_email
     ON invitations(tenant_id, email) WHERE status = 'pending';
