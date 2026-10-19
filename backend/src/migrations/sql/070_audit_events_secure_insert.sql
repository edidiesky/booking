DROP FUNCTION IF EXISTS app.record_audit_event(TEXT, TEXT, UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS app.record_audit_event(
  UUID, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT,
  TEXT, TEXT, TEXT[], JSONB, JSONB, JSONB, INET, TEXT, TIMESTAMPTZ
);
CREATE OR REPLACE FUNCTION app.record_audit_event(
  p_tenant_id           UUID,
  p_actor_type          TEXT,
  p_actor_id            UUID,
  p_actor_email         TEXT,
  p_actor_name          TEXT,
  p_action              TEXT,
  p_target_type         TEXT,
  p_target_id           TEXT,
  p_affected_user_id    UUID,
  p_affected_user_email TEXT,
  p_outcome             TEXT,
  p_denial_reason       TEXT,
  p_changed_fields      TEXT[],
  p_before_value        JSONB,
  p_after_value         JSONB,
  p_metadata            JSONB,
  p_origin_ip           INET,
  p_request_id          TEXT,
  p_occurred_at         TIMESTAMPTZ
) RETURNS audit_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row audit_events;
BEGIN
  INSERT INTO audit_events (
    tenant_id, actor_type, actor_id, actor_email, actor_name,
    action, target_type, target_id, affected_user_id, affected_user_email,
    outcome, denial_reason, changed_fields, before_value, after_value,
    metadata, origin_ip, request_id, occurred_at
  ) VALUES (
    p_tenant_id, p_actor_type, p_actor_id, p_actor_email, p_actor_name,
    p_action, p_target_type, p_target_id, p_affected_user_id, p_affected_user_email,
    p_outcome, p_denial_reason, p_changed_fields, p_before_value, p_after_value,
    COALESCE(p_metadata, '{}'::jsonb), p_origin_ip, p_request_id,
    COALESCE(p_occurred_at, now())
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION app.record_audit_event FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.record_audit_event TO booking_app, booking_worker;