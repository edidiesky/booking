openssl rand -hex 24
# Append to the end of booking-infra/scripts/generate-secrets.sh
echo ""
echo "# --- Database roles (docker-compose db-roles service creates these on every up) ---"
echo "POSTGRES_USER=postgres"
echo "POSTGRES_DB=booking_platform"
echo "POSTGRES_PASSWORD=$(generate_url_safe_password)"
echo "PGBOUNCER_AUTH_PASSWORD=$(generate_url_safe_password)"
echo "APP_DB_PASSWORD=$(generate_url_safe_password)"
echo "WORKER_DB_PASSWORD=$(generate_url_safe_password)"
