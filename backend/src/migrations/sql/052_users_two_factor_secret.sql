/* TOTP secret + hashed backup codes for authenticator MFA. */

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_secret        TEXT,
  ADD COLUMN IF NOT EXISTS two_factor_backup_codes  TEXT[];  -- bcrypt hashes

COMMENT ON COLUMN users.two_factor_secret IS 'TOTP shared secret; set on setup, cleared on disable';
COMMENT ON COLUMN users.two_factor_backup_codes IS 'Hashed one-time backup codes';