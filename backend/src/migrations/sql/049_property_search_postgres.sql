/* 0XX property_search_postgres */
/* Replaces Elasticsearch as the property search read path.
   Postgres was already the source of truth for writes (see 043's own
   comment: "Postgres stays the source of truth for writes,
   Elasticsearch... is the read path"), this migration moves the read
   path back in too, closing that split entirely.

   Three real mechanisms, matching three real things the ES query did:
     1. tsvector, weighted (name > description, matches ES's name^3
        boost) for relevance-ranked full-text search.
     2. pg_trgm, fallback only when the tsquery matches nothing, for
        typo tolerance (matches ES's fuzziness: "AUTO"). Not used as
        the primary path, trigram similarity alone has no real
        relevance ranking, tsvector does.
     3. earthdistance/cube, not full PostGIS, this only ever needs a
        simple radius filter + distance sort, not spatial joins or
        polygons, PostGIS would be real, unjustified overhead for
        this use case. */

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

ALTER TABLE properties ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_properties_search_vector ON properties USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_properties_name_trgm      ON properties USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_geo ON properties
  USING GIST (ll_to_earth(latitude, longitude))
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_amenities ON properties USING GIN (amenities);