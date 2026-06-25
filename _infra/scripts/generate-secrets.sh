#!/bin/bash

echo "# Generated $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "# Paste into .env and .env.infra — never commit"
echo ""

generate_hex_secret() {
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

# URL-safe: alphanumeric only, no special chars that break connection strings
# Safe in redis://, amqp://, mongodb+srv:// without encoding
generate_url_safe_password() {
  node -e "
    const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes  = require('crypto').randomBytes(32);
    let result   = '';
    for (let i = 0; i < 32; i++) {
      result += chars[bytes[i] % chars.length];
    }
    console.log(result);
  "
}

echo "# ─── .env ────────────────────────────────────────────────────────────────────"
echo "JWT_ACCESS_SECRET=$(generate_hex_secret)"
echo "JWT_REFRESH_SECRET=$(generate_hex_secret)"
echo "API_ACCESS_SECRET=$(generate_hex_secret)"
echo ""
echo "# ─── .env.infra ──────────────────────────────────────────────────────────────"
echo "RABBITMQ_USER=akirs"
echo "RABBITMQ_PASSWORD=$(generate_url_safe_password)"
echo "REDIS_PASSWORD=$(generate_url_safe_password)"
echo ""
echo "# ─── Connection strings (paste into .env, replace <REDIS_PW> and <RABBIT_PW>) ─"
REDIS_PW=$(generate_url_safe_password)
RABBIT_PW=$(generate_url_safe_password)
echo "# NOTE: run the script again and copy REDIS_PASSWORD and RABBITMQ_PASSWORD"
echo "# then build the URLs manually like:"
echo "# REDIS_URL=redis://:<REDIS_PASSWORD>@proptytax_redis:6379"
echo "# RABBITMQ_URL=amqp://akirs:<RABBITMQ_PASSWORD>@proptytax_rabbitmq:5672"