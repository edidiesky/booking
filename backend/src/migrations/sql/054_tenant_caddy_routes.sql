ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS caddy_subdomain_route_id TEXT,
  ADD COLUMN IF NOT EXISTS caddy_custom_route_id    TEXT,
  ADD COLUMN IF NOT EXISTS custom_domain_verification_token TEXT;