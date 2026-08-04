/* Campaign notification system. Audience is resolved from a structured
     filter (see audience.resolver.ts), not a saved list, so a draft
     campaign's audience count stays live until send time, when it's
     snapshotted into campaign_recipients (one row per user per channel,
     that snapshot is what makes "who exactly got this" answerable after
     the fact, and what makes idempotent claim-based sending possible,
     the same discipline as the booking availability fix: atomic
     claim-before-send, not check-then-send). */

CREATE TABLE IF NOT EXISTS user_notification_preferences (
     user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     channel     VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
     category    VARCHAR(20) NOT NULL CHECK (category IN ('marketing', 'transactional')),
     opted_in    BOOLEAN NOT NULL DEFAULT true,
     updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
     PRIMARY KEY (user_id, channel, category)
   );

   CREATE TABLE IF NOT EXISTS campaigns (
     id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
     name            VARCHAR(200) NOT NULL,
     status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled')),
     audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
     channels        TEXT[] NOT NULL DEFAULT '{}',
     scheduled_at    TIMESTAMPTZ,
     created_by      UUID REFERENCES users(id),
     created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
     updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
   );

   CREATE TABLE IF NOT EXISTS campaign_templates (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
     channel      VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
     subject      VARCHAR(200),
     body         TEXT NOT NULL,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (campaign_id, channel)
   );

   CREATE TABLE IF NOT EXISTS campaign_recipients (
     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
     user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     channel      VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
     status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped_preference', 'skipped_provider_down')),
     attempt_count INTEGER NOT NULL DEFAULT 0,
     error        TEXT,
     sent_at      TIMESTAMPTZ,
     created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (campaign_id, user_id, channel)
   );
   CREATE INDEX IF NOT EXISTS idx_campaign_recipients_claim ON campaign_recipients(campaign_id, status);
   CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id, status);
