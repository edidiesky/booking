
CREATE TABLE IF NOT EXISTS seller_notifications (
     id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
     booking_id  UUID REFERENCES bookings(id) ON DELETE CASCADE,
     type        VARCHAR(30) NOT NULL CHECK (type IN ('booking_confirmed', 'booking_checked_in', 'booking_checked_out')),
     title       VARCHAR(200) NOT NULL,
     body        TEXT NOT NULL,
     is_read     BOOLEAN NOT NULL DEFAULT false,
     created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE INDEX IF NOT EXISTS idx_seller_notifications_tenant ON seller_notifications(tenant_id, is_read, created_at DESC);
