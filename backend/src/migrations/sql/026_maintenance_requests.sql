

    CREATE TABLE IF NOT EXISTS maintenance_requests (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_type_id UUID         NOT NULL REFERENCES room_types(id),
      tenant_id    UUID,
      title        VARCHAR(200) NOT NULL,
      description  TEXT,
      priority     VARCHAR(20)  NOT NULL DEFAULT 'medium',
      status       VARCHAR(20)  NOT NULL DEFAULT 'open',
      resolved_at  TIMESTAMPTZ,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_maintenance_room_type ON maintenance_requests(room_type_id, status);
  
