/* 050 conversations and messages */
/**
* 1. host tenant 
* 2. RLS Enforcements for tenants only
* 3. RLS Enforcements not enforecable for guests
*/

CREATE TABLE IF NOT EXISTS conversations (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID           NOT NULL REFERENCES tenants(id),
    host_user_id    UUID           NOT NULL REFERENCES users(id),
    guest_user_id   UUID           NOT NULL REFERENCES users(id),
    property_id     UUID           REFERENCES properties(id),
    booking_id      UUID           REFERENCES bookings(id),
    last_message_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT chk_host_guest_different CHECK (host_user_id <> guest_user_id)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_host_guest_property
    ON conversations (tenant_id, host_user_id, guest_user_id, property_id)
    WHERE property_id IS NOT NULL;

  CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_host_guest_no_property
    ON conversations (tenant_id, host_user_id, guest_user_id)
    WHERE property_id IS NULL;

  CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id, last_message_at DESC);
  CREATE INDEX IF NOT EXISTS idx_conversations_guest  ON conversations(guest_user_id, last_message_at DESC);
  CREATE INDEX IF NOT EXISTS idx_conversations_host   ON conversations(host_user_id, last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID          NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tenant_id       UUID          NOT NULL REFERENCES tenants(id),
    sender_id       UUID          NOT NULL REFERENCES users(id),
    body            TEXT          NOT NULL,
    status          TEXT          NOT NULL DEFAULT 'sent'
                                   CHECK (status IN ('sent', 'delivered', 'read')),
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),

    CONSTRAINT chk_body_not_empty CHECK (length(trim(body)) > 0)
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_tenant       ON messages(tenant_id, created_at DESC);

  ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS tenant_isolation ON conversations;
  CREATE POLICY tenant_isolation ON conversations
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

  DROP POLICY IF EXISTS tenant_isolation ON messages;
  CREATE POLICY tenant_isolation ON messages
    USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);