/** Rentals */

  CREATE TABLE IF NOT EXISTS renters (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id                 UUID         NOT NULL REFERENCES tenants(id),
    full_name                VARCHAR(200) NOT NULL,
    email                    VARCHAR(255),
    phone                    VARCHAR(30),
    emergency_contact_name   VARCHAR(200),
    emergency_contact_phone  VARCHAR(30),
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT now()
  );
  ALTER TABLE renters ADD COLUMN IF NOT EXISTS guest_user_id UUID REFERENCES users(id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_renters_owner_guest ON renters(owner_id, guest_user_id) WHERE guest_user_id IS NOT NULL;
