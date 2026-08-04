CREATE TABLE IF NOT EXISTS notifications (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type             notification_type    NOT NULL,
    channel          notification_channel NOT NULL,
    status           notification_status  NOT NULL DEFAULT 'pending',
    recipient_email  VARCHAR(255),
    recipient_phone  VARCHAR(30),
    tenant_id        UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id          UUID REFERENCES users(id)   ON DELETE SET NULL,
    subject          TEXT,
    message          TEXT                NOT NULL,
    metadata         JSONB               NOT NULL DEFAULT '{}',
    sent_at          TIMESTAMPTZ,
    failure_reason   TEXT,
    created_at       TIMESTAMPTZ         NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ         NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_notif_type_status ON notifications(type, status);
  CREATE INDEX IF NOT EXISTS idx_notif_tenant      ON notifications(tenant_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_notif_user        ON notifications(user_id, created_at DESC);
