/*  */

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
