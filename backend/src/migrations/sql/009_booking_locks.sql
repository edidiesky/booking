/* 009 booking_locks */

CREATE TABLE IF NOT EXISTS booking_locks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id UUID        NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    check_in     DATE        NOT NULL,
    check_out    DATE        NOT NULL,
    rooms_held   INT         NOT NULL DEFAULT 1,
    session_id   VARCHAR(64) NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_locks_room_dates ON booking_locks(room_type_id, check_in, check_out);
  CREATE INDEX IF NOT EXISTS idx_locks_expires    ON booking_locks(expires_at);
  CREATE INDEX IF NOT EXISTS idx_locks_session    ON booking_locks(session_id);
