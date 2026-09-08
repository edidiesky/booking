# property-search-worker

**This package is dead code. It is not running, standalone or
in-process, anywhere in this platform.**

## What it used to do

Consumed property-change events (create/update/delete) and synced them
to an Elasticsearch index (`esClient.ts`, `handlers.ts`), so property
search could query Elasticsearch's full-text and geo capabilities
instead of Postgres directly.

## Why it stopped running

Elasticsearch was removed from this platform's architecture entirely.
Property search now runs directly in Postgres:

- A generated, weighted `tsvector` column (name weighted above
  description, matching Elasticsearch's old `name^3` boost) for
  relevance-ranked full-text search
- `pg_trgm` similarity as a fallback, only when the primary `tsquery`
  search returns nothing, for typo tolerance (matching Elasticsearch's
  old `fuzziness: "AUTO"` behavior)
- `earthdistance`/`cube`, not full PostGIS, for radius filtering and
  distance sorting, a simple radius query doesn't need PostGIS's
  spatial joins or polygon support

With Postgres as both the write path (always was) and now also the
read path, there's nothing left for this worker to sync, its entire
job was closing that gap.

## Real, honest current state

- The package's source still exists on disk, it was **not deleted**.
- It is not imported anywhere, not in backend's in-process worker
  bootstrap, not as a standalone container.
- `backend/src/config/elasticSearch.ts` (the Elasticsearch client
  config this worker also depended on) has its own bootstrap step
  already commented out in `backend/src/server/bootstrap.ts`, dead
  code on the backend side too, consistent with this worker's own
  status.
- Real, undone cleanup: this package, its Elasticsearch client
  config, and any remaining references in CI/CD pipeline configs or
  docker-compose files are candidates for actual deletion, not just
  documentation. Left in place deliberately for now rather than
  removed without a final check of every reference.