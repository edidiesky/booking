/* Generic, audience-agnostic in-app notification, keyed by user_id only
     (no tenant_id requirement), unlike seller_notifications (host/tenant
     dashboard bell, booking-lifecycle events only). This is what a
     campaign's in_app channel actually needs: a guest with no tenant_id
     can receive one too. Deliberately not merging this with
     seller_notifications, they have different audiences and different
     required columns (tenant_id NOT NULL there, nullable here), forcing
     one shape to fit both would mean either loosening a constraint that
     protects real data (tenant scoping on the host feed) or adding
     nullable columns nobody needs on the host side. */

CREATE TABLE IF NOT EXISTS user_notifications (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     source      VARCHAR(20) NOT NULL DEFAULT 'campaign' CHECK (source IN ('campaign', 'system')),
     campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
     title       VARCHAR(200) NOT NULL,
     body        TEXT NOT NULL,
     is_read     BOOLEAN NOT NULL DEFAULT false,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id, is_read, created_at DESC);
