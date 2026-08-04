/* Real clock-time precision for check-in/check-out, not just dates.
     Needed for the maintenance buffer (3 hours after actual checkout,
     not "the next calendar day") and for a real hour-level day view.
     USING clause backfills existing DATE values at midnight UTC, hosts
     with existing bookings will see 00:00 check-in/check-out times
     until they're corrected, that's an accurate reflection of "we only
     ever knew the date," not new data being fabricated. */

ALTER TABLE bookings DROP COLUMN IF EXISTS nights;
   ALTER TABLE bookings ALTER COLUMN check_in TYPE TIMESTAMPTZ USING check_in::timestamptz;
   ALTER TABLE bookings ALTER COLUMN check_out TYPE TIMESTAMPTZ USING check_out::timestamptz;
   ALTER TABLE booking_locks ALTER COLUMN check_in TYPE TIMESTAMPTZ USING check_in::timestamptz;
   ALTER TABLE booking_locks ALTER COLUMN check_out TYPE TIMESTAMPTZ USING check_out::timestamptz;
   ALTER TABLE bookings ADD COLUMN nights INT GENERATED ALWAYS AS
     (CEIL(EXTRACT(EPOCH FROM (check_out - check_in)) / 86400)::int) STORED;
