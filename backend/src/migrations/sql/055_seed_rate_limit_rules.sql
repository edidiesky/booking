/* 049_seed_rate_limit_rules.sql, critical + hot paths */

INSERT INTO rate_limit_rules (id_type, id_value, resource, algorithm, max_request, interval_ms, enabled)
VALUES
  ('ip', '*', '/api/v1/auth/login', 'sliding-window-log', 3, 60000, true),
  ('ip', '*', '/api/v1/auth/register', 'sliding-window-log', 3, 60000, true),
  ('user_id', '*', '/api/v1/auth/change-password', 'sliding-window-log', 3, 300000, true),
  ('ip', '*', '/api/v1/auth/request-reset', 'sliding-window-log', 2, 300000, true),
  ('ip', '*', '/api/v1/auth/2fa/verify-login', 'sliding-window-log', 3, 60000, true),
  ('ip', '*', '/api/v1/auth/login/verify-email-otp', 'sliding-window-log', 3, 60000, true),

  ('user_id', '*', '/api/v1/payments/initialize', 'sliding-window-log', 3, 60000, true),
  ('ip', '*', '/api/v1/webhooks/paystack', 'sliding-window-log', 30, 60000, true),
  ('ip', '*', '/api/v1/webhooks/flutterwave', 'sliding-window-log', 30, 60000, true),
  ('user_id', '*', '/api/v1/bookings', 'sliding-window-log', 6, 60000, true),
  ('ip', '*', '/api/v1/properties/room-types/*/availability', 'token-bucket', 120, 60000, true),
  ('ip', '*', '/api/v1/properties', 'token-bucket', 120, 60000, true),
  ('ip', '*', '*', 'token-bucket', 20, 60000, true)

ON CONFLICT (id_type, id_value, resource) DO NOTHING;