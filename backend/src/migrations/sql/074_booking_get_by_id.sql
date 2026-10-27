
CREATE OR REPLACE FUNCTION public.booking_get_by_id(p_id uuid)
RETURNS SETOF bookings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM bookings WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION public.booking_get_by_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.booking_get_by_id(uuid)
  TO booking_app, booking_worker;