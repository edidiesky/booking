/* 022 users: transaction PIN + 2FA/phone-verification state.
     OTP codes themselves are NOT stored here, see security.service.ts,
     they live in Redis with a native TTL instead (short-lived,
     high-write-frequency, no need for durability or relational
     integrity, a plain Postgres UPDATE per OTP request is wasted write
     load on a table you actually care about querying/replicating). Only
     the durable outcomes (has a PIN, is 2FA on, is phone verified) live
     here. */

ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash            VARCHAR(255);
   ALTER TABLE users ADD COLUMN IF NOT EXISTS is_phone_verified   BOOLEAN NOT NULL DEFAULT false;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled  BOOLEAN NOT NULL DEFAULT false;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS login_with_pin_enabled BOOLEAN NOT NULL DEFAULT false;
   ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code        VARCHAR(5);
