-- Bootstrap assign for registration (and any TX that already holds the right client).
-- Table RLS stays enabled; this function is SECURITY DEFINER.

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.assign_user_role(
  p_user_id     UUID,
  p_tenant_id   UUID,
  p_role_id     UUID,
  p_assigned_by UUID,
  p_reason      TEXT DEFAULT NULL
) RETURNS user_roles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row user_roles;
BEGIN
  IF p_user_id IS NULL OR p_role_id IS NULL OR p_assigned_by IS NULL THEN
    RAISE EXCEPTION 'assign_user_role: user_id, role_id, assigned_by are required';
  END IF;

  -- Reactivate / change role if a row already exists for this user+tenant
  IF p_tenant_id IS NOT NULL THEN
    UPDATE user_roles
       SET role_id     = p_role_id,
           assigned_by = p_assigned_by,
           assigned_at  = now(),
           reason      = p_reason,
           is_active   = true,
           updated_at  = now()
     WHERE user_id = p_user_id
       AND tenant_id = p_tenant_id
     RETURNING * INTO v_row;

    IF FOUND THEN
      RETURN v_row;
    END IF;

    INSERT INTO user_roles (user_id, tenant_id, role_id, assigned_by, reason)
    VALUES (p_user_id, p_tenant_id, p_role_id, p_assigned_by, p_reason)
    RETURNING * INTO v_row;
    RETURN v_row;
  END IF;

  UPDATE user_roles
     SET role_id     = p_role_id,
         assigned_by = p_assigned_by,
         assigned_at  = now(),
         reason      = p_reason,
         is_active   = true,
         updated_at  = now()
   WHERE user_id = p_user_id
     AND tenant_id IS NULL
   RETURNING * INTO v_row;

  IF FOUND THEN
    RETURN v_row;
  END IF;

  INSERT INTO user_roles (user_id, tenant_id, role_id, assigned_by, reason)
  VALUES (p_user_id, NULL, p_role_id, p_assigned_by, p_reason)
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION app.assign_user_role(UUID, UUID, UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app.assign_user_role(UUID, UUID, UUID, UUID, TEXT) TO booking_app;