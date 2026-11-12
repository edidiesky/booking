#!/bin/bash
set -euo pipefail

# Real, adapted from the proven prior project's script, one real
# change: uses COORDINATOR_HOST from the environment instead of a
# hardcoded "coordinator" hostname, since this service's coordinator
# container is named ledger-coordinator, not coordinator, real,
# necessary for this to actually resolve on the ledger-net network.

COORDINATOR_HOST="${COORDINATOR_HOST:-ledger-coordinator}"
DB_NAME="${POSTGRES_DB:-ledger_service}"

echo "Waiting for coordinator (${COORDINATOR_HOST}) to accept connections..."

until pg_isready -h "${COORDINATOR_HOST}" -p 5432 -U postgres -d "${DB_NAME}" -t 3; do
  echo "Coordinator not ready yet, sleeping 3 seconds..."
  sleep 3
done

echo "Coordinator is ready!"
