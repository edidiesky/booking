/* 010 bookings */

CREATE TABLE IF NOT EXISTS bookings (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_ref        VARCHAR(20)    NOT NULL UNIQUE,
    tenant_id          UUID           NOT NULL REFERENCES tenants(id),
    property_id        UUID           NOT NULL REFERENCES properties(id),
    room_type_id       UUID           NOT NULL REFERENCES room_types(id),
    guest_user_id      UUID           NOT NULL REFERENCES users(id),
    rooms_count        INT            NOT NULL DEFAULT 1,
    check_in           DATE           NOT NULL,
    check_out          DATE           NOT NULL,
    nights             INT            GENERATED ALWAYS AS (check_out - check_in) STORED,
    guest_count        INT            NOT NULL DEFAULT 1,
    total_amount_ngn   NUMERIC(12,2)  NOT NULL,
    platform_fee_ngn   NUMERIC(12,2)  NOT NULL,
    host_payout_ngn    NUMERIC(12,2)  NOT NULL,
    status             booking_status NOT NULL DEFAULT 'pending_payment',
    cancellation_reason TEXT,
    cancelled_at       TIMESTAMPTZ,
    special_requests   TEXT,
    metadata           JSONB          NOT NULL DEFAULT '{}',
    created_at         TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT chk_checkout_after_checkin CHECK (check_out > check_in),
    CONSTRAINT chk_rooms_positive CHECK (rooms_count > 0)
  );
  CREATE INDEX IF NOT EXISTS idx_bookings_tenant        ON bookings(tenant_id, status);
  CREATE INDEX IF NOT EXISTS idx_bookings_guest         ON bookings(guest_user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_bookings_room_dates    ON bookings(room_type_id, check_in, check_out);
  CREATE INDEX IF NOT EXISTS idx_bookings_ref           ON bookings(booking_ref);
  CREATE INDEX IF NOT EXISTS idx_bookings_status        ON bookings(status, created_at DESC);
