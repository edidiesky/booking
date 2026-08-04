/* Core seller (host/tenant) public profile metadata: bio, avatar,
     location. Real dedicated columns, not the settings JSONB blob,
     that's operational config (timezone/currency/locale), this is
     public profile content a guest sees on the property page, deserves
     its own queryable columns the same way PropertyAddress does, not a
     schemaless bag. */

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS bio         TEXT;
   ALTER TABLE tenants ADD COLUMN IF NOT EXISTS avatar_url  TEXT;
   ALTER TABLE tenants ADD COLUMN IF NOT EXISTS city        VARCHAR(100);
   ALTER TABLE tenants ADD COLUMN IF NOT EXISTS state       VARCHAR(100);
   ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country     VARCHAR(100);
