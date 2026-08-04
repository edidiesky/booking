/* Dedicated lat/lng columns, not buried in the address JSONB.
     Postgres stays the source of truth for writes, Elasticsearch (see
     the property-search-worker) is the read path for anything geo or
     full-text, this is what gets synced to ES's geo_point field. */

ALTER TABLE properties ADD COLUMN IF NOT EXISTS latitude  NUMERIC(9,6);
   ALTER TABLE properties ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);
