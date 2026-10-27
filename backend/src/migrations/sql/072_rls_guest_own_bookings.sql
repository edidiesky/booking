/* 072: guest can read/update their own bookings without a tenant session. */

CREATE OR REPLACE FUNCTION public.app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

DROP POLICY IF EXISTS guest_own_bookings ON bookings;
CREATE POLICY guest_own_bookings ON bookings
  FOR SELECT
  USING (guest_user_id = public.app_user_id());

DROP POLICY IF EXISTS guest_update_own_bookings ON bookings;
CREATE POLICY guest_update_own_bookings ON bookings
  FOR UPDATE
  USING (guest_user_id = public.app_user_id())
  WITH CHECK (guest_user_id = public.app_user_id());

DROP POLICY IF EXISTS guest_own_payments ON payments;
CREATE POLICY guest_own_payments ON payments
  FOR SELECT
  USING (guest_user_id = public.app_user_id());