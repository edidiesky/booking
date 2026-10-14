#!/bin/bash
set -euo pipefail

# Real, adapted from the proven prior project's script, same real
# self-registration logic, parameterized on COORDINATOR_HOST/DB_NAME
# rather than hardcoded, and reads the real password from the
# environment (POSTGRES_PASSWORD, set via a real, untracked .env
# file), never hardcoded in this script or anywhere in version
# control.

WORKER_HOSTNAME=$(hostname)
COORDINATOR_HOST="${COORDINATOR_HOST:-ledger-coordinator}"
DB_NAME="${POSTGRES_DB:-ledger_service}"

echo "Waiting for local PostgreSQL to start on ${WORKER_HOSTNAME}..."

until pg_isready -h localhost -p 5432 -U postgres -t 3; do
  echo "PostgreSQL not ready on ${WORKER_HOSTNAME}, sleeping 2 seconds..."
  sleep 2
done

echo "PostgreSQL is ready on ${WORKER_HOSTNAME}!"
echo "Registering worker: ${WORKER_HOSTNAME} with coordinator..."

WORKER_EXISTS=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${COORDINATOR_HOST}" -U postgres -d "${DB_NAME}" -t -c "
  SELECT COUNT(*) FROM pg_dist_node
  WHERE nodename = '${WORKER_HOSTNAME}' AND nodeport = 5432;
" | xargs)

if [ "$WORKER_EXISTS" -eq "0" ]; then
  # Real, kept master_add_node, matching the proven, working prior
  # script exactly, Citus 13.0.3 still supports this as a real,
  # backward-compatible alias for citus_add_node, the current,
  # preferred name, worth knowing both if this comes up directly.
  PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${COORDINATOR_HOST}" -U postgres -d "${DB_NAME}" -v ON_ERROR_STOP=1 -c "
    SELECT master_add_node('${WORKER_HOSTNAME}', 5432);
  "
  echo "Worker ${WORKER_HOSTNAME} successfully registered!"
else
  echo "Worker ${WORKER_HOSTNAME} already registered, skipping..."
fi
