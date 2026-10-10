#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<EOSQL
CREATE ROLE pganalyze WITH LOGIN PASSWORD '${PGANALYZE_PASSWORD}';
GRANT pg_monitor TO pganalyze;
GRANT CONNECT ON DATABASE ${POSTGRES_DB} TO pganalyze;
EOSQL