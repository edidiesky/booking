/* 071: allow marketplace guests to read availability without a tenant session.

   Policy is SELECT-only on non-blocked rows. Writes still require the
   tenant_isolation policy (tenant session). */

DROP POLICY IF EXISTS public_read_available ON availability_calendar;
CREATE POLICY public_read_available ON availability_calendar
  FOR SELECT
  USING (is_blocked = false);