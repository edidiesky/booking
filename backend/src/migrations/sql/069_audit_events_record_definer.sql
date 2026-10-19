CREATE OR REPLACE FUNCTION app.record_audit_event(
  p_action      TEXT,
  p_resource    TEXT,
  p_tenant_id   UUID,
  p_user_id     UUID,
  p_metadata    JSONB DEFAULT '{}'::jsonb
) RETURNS audit_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row audit_events;
BEGIN
  INSERT INTO audit_events (
    action,
    resource,
    tenant_id,
    user_id,
    metadata,
    created_at
  )
  VALUES (
    p_action,
    p_resource,
    p_tenant_id,
    p_user_id,
    COALESCE(p_metadata, '{}'::jsonb),
    now()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION app.record_audit_event(TEXT, TEXT, UUID, UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.record_audit_event(TEXT, TEXT, UUID, UUID, JSONB) TO booking_app;