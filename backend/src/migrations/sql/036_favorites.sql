CREATE TABLE IF NOT EXISTS favorites (
     id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     guest_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
     UNIQUE (guest_user_id, property_id)
   );
   CREATE INDEX IF NOT EXISTS idx_favorites_guest ON favorites(guest_user_id, created_at DESC);
