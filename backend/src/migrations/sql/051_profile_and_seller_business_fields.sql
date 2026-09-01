/* Person profile extras + seller/business identity on tenants.
   Verification columns are nullable placeholders for a future KYC/tax flow. */

-- Person (staff / host user)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS job_title              VARCHAR(120),
  ADD COLUMN IF NOT EXISTS phone                  VARCHAR(30),
  ADD COLUMN IF NOT EXISTS tax_id                 VARCHAR(64),
  ADD COLUMN IF NOT EXISTS tax_id_verified_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS identity_verified_at   TIMESTAMPTZ;

-- Seller / workspace (tenant)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS legal_name               VARCHAR(255),
  ADD COLUMN IF NOT EXISTS tax_id                   VARCHAR(64),
  ADD COLUMN IF NOT EXISTS registration_number      VARCHAR(64),
  ADD COLUMN IF NOT EXISTS support_email            VARCHAR(255),
  ADD COLUMN IF NOT EXISTS support_phone            VARCHAR(30),
  ADD COLUMN IF NOT EXISTS website                  VARCHAR(500),
  ADD COLUMN IF NOT EXISTS address_line1            VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address_line2            VARCHAR(255),
  ADD COLUMN IF NOT EXISTS postal_code              VARCHAR(32),
  ADD COLUMN IF NOT EXISTS tax_id_verified_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS business_verified_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_status      VARCHAR(32) NOT NULL DEFAULT 'unverified';
  -- unverified | pending | verified | rejected

COMMENT ON COLUMN profiles.tax_id IS 'Personal tax ID / TIN; verification deferred';
COMMENT ON COLUMN tenants.tax_id IS 'Business tax ID / TIN; verification deferred';
COMMENT ON COLUMN tenants.verification_status IS 'Seller KYC/business verification state; flow not implemented yet';