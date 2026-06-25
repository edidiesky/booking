#!/bin/bash

# generate-env.sh
# Run: chmod +x generate-env.sh && ./generate-env.sh

set -euo pipefail

generate_secret() {
  local length=${1:-32}
  openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c "$length"
}

JWT_SECRET=$(generate_secret 48)
INTERNAL_SECRET=$(generate_secret 48)
REDIS_PASSWORD=$(generate_secret 32)
WEBHOOK_SECRET=$(generate_secret 32)

cat > .env.production << EOF
NODE_ENV=production
PORT=4000

# PostgreSQL
DATABASE_URL=postgresql://postgres:CHANGE_ME@host.docker.internal:5432/booking_platform

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# JWT
JWT_SECRET=${JWT_SECRET}

# Paystack
PAYSTACK_SECRET_KEY=sk_live_CHANGE_ME
PAYSTACK_WEBHOOK_SECRET=${WEBHOOK_SECRET}

# Flutterwave
FLW_SECRET_KEY=FLWSECK_CHANGE_ME
FLW_WEBHOOK_SECRET=$(generate_secret 32)

# App
WEB_ORIGIN=https://CHANGE_ME.com
BASE_DOMAIN=CHANGE_ME.com

# OTel
OTEL_SERVICE_NAME=booking-platform
OTEL_ENABLED=true
TEMPO_URL=http://tempo:4318/v1/traces

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=$(generate_secret 24)

# Outbox
OUTBOX_POLL_INTERVAL_MS=5000
INTERNAL_SECRET=${INTERNAL_SECRET}
EOF

# Also write redis.conf with the generated password
mkdir -p _infra/redis
cat > _infra/redis/redis.conf << EOF
requirepass ${REDIS_PASSWORD}
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly no
save ""
EOF

echo ""
echo "✅ Generated .env.production"
echo "✅ Generated _infra/redis/redis.conf"
echo ""
echo "⚠️  Still needs manual values:"
echo "   DATABASE_URL     → set your Postgres password"
echo "   PAYSTACK_SECRET_KEY"
echo "   FLW_SECRET_KEY"
echo "   WEB_ORIGIN / BASE_DOMAIN"
echo ""
echo "🔑 Generated secrets:"
echo "   JWT_SECRET       = ${JWT_SECRET}"
echo "   REDIS_PASSWORD   = ${REDIS_PASSWORD}"
echo "   INTERNAL_SECRET  = ${INTERNAL_SECRET}"