CREATE OR REPLACE FUNCTION public.booking_get_for_actor(
  p_id uuid,
  p_user_id uuid,
  p_tenant_id uuid DEFAULT NULL
)
RETURNS SETOF bookings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.*
  FROM bookings b
  WHERE b.id = p_id
    AND (
      b.guest_user_id = p_user_id
      OR (p_tenant_id IS NOT NULL AND b.tenant_id = p_tenant_id)
    );
$$;

REVOKE ALL ON FUNCTION public.booking_get_for_actor(uuid, uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.booking_get_for_actor(uuid, uuid, uuid) TO booking_app;