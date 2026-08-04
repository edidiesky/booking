
  CREATE TABLE IF NOT EXISTS reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id        UUID          NOT NULL REFERENCES room_types(id),
    property_id         UUID          NOT NULL REFERENCES properties(id),
    tenant_id           UUID          NOT NULL REFERENCES tenants(id),
    guest_user_id       UUID          NOT NULL REFERENCES users(id),
    booking_id          UUID          NOT NULL REFERENCES bookings(id),
    rating              INT           NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title               VARCHAR(150)  NOT NULL,
    comment             TEXT          NOT NULL,
    images              TEXT[]        NOT NULL DEFAULT '{}',
    is_verified_purchase BOOLEAN      NOT NULL DEFAULT true,
    status              VARCHAR(20)   NOT NULL DEFAULT 'approved',
    helpful_count       INT           NOT NULL DEFAULT 0,
    unhelpful_count     INT           NOT NULL DEFAULT 0,
    response_text       TEXT,
    response_by         UUID REFERENCES users(id),
    response_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    UNIQUE(booking_id, room_type_id)
  );
  CREATE INDEX IF NOT EXISTS idx_reviews_room_type ON reviews(room_type_id, status, rating DESC);
  CREATE INDEX IF NOT EXISTS idx_reviews_tenant    ON reviews(tenant_id, status);
  CREATE INDEX IF NOT EXISTS idx_reviews_guest     ON reviews(guest_user_id);
