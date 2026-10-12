/* 062: make RLS usable by a non-superuser runtime role.

   1. app_tenant_id(): NULLIF-wrapped tenant lookup. After any connection has
      run set_config('app.current_tenant_id', ..., true), current_setting()
      returns '' (not NULL) once the transaction ends, and ''::uuid raises
      "invalid input syntax for type uuid". Under PgBouncer transaction pooling
      that hits un-scoped queries on a previously-used connection, at random.
      With the helper, "no tenant" is always NULL, so the policy matches no rows.

   2. Public read of live listings. Marketplace search / discovery run with no
      tenant on the main domain and read properties + room_types directly.
      Policies are permissive and OR together, so this adds read access to
      active rows only; tenant_isolation still governs everything else.
      The status check mirrors what the search queries already filter on. */

CREATE OR REPLACE FUNCTION public.app_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
$$;

DO $$
DECLARE
  t text;
  strict_tables CONSTANT text[] := ARRAY[
    'properties', 'room_types', 'bookings', 'payments', 'escrow_ledger',
    'invoices', 'invitations', 'seller_notifications', 'reviews',
    'availability_calendar', 'user_roles',
    'audit_events', 'conversations', 'messages'
  ];
  nullable_tables CONSTANT text[] := ARRAY['roles', 'campaigns'];
BEGIN
  FOREACH t IN ARRAY strict_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_policies
               WHERE schemaname = 'public' AND tablename = t AND policyname = 'tenant_isolation') THEN
      EXECUTE format(
        'ALTER POLICY tenant_isolation ON public.%I USING (tenant_id = public.app_tenant_id())', t);
    ELSE
      RAISE NOTICE '062: no tenant_isolation policy on %, skipped', t;
    END IF;
  END LOOP;

  FOREACH t IN ARRAY nullable_tables LOOP
    IF EXISTS (SELECT 1 FROM pg_policies
               WHERE schemaname = 'public' AND tablename = t AND policyname = 'tenant_isolation') THEN
      EXECUTE format(
        'ALTER POLICY tenant_isolation ON public.%I USING (tenant_id IS NULL OR tenant_id = public.app_tenant_id())', t);
    ELSE
      RAISE NOTICE '062: no tenant_isolation policy on %, skipped', t;
    END IF;
  END LOOP;
END $$;

DROP POLICY IF EXISTS public_read_active ON properties;
CREATE POLICY public_read_active ON properties
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS public_read_active ON room_types;
CREATE POLICY public_read_active ON room_types
  FOR SELECT USING (status = 'active');
