# # Build stage
# FROM node:20-alpine AS builder

# WORKDIR /app
# RUN addgroup -g 1001 eddy-booking && \
#     adduser -S eddy-booking -u 1001 -G eddy-booking

# # Root workspace files needed to resolve packages/shared as a workspace member
# COPY package.json package-lock.json tsconfig.base.json ./
# COPY packages/shared ./packages/shared

# RUN npm ci --workspace=@booking/shared --include-workspace-root
# RUN npm run build -w @booking/shared

# WORKDIR /app/backend
# COPY backend/package.json backend/package-lock.json ./
# RUN npm ci

# COPY backend/src ./src
# COPY backend/tsconfig.json ./

# RUN npx tsc
# RUN cp -r src/domains/notification/templates dist/domains/notification/templates


# # Production stage
# FROM node:20-alpine

# WORKDIR /app/backend
# RUN addgroup -g 1001 eddy-booking && \
#     adduser -S eddy-booking -u 1001 -G eddy-booking

# RUN apk add --no-cache \
#     curl \
#     chromium \
#     nss \
#     freetype \
#     harfbuzz \
#     ca-certificates \
#     ttf-freefont

# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# COPY --from=builder /app/packages/shared /app/packages/shared
# COPY backend/package.json backend/package-lock.json ./
# RUN npm ci --only=production && npm cache clean --force

# COPY --from=builder /app/backend/dist ./dist
# COPY backend/src/assets ./assets

# USER eddy-booking

# EXPOSE 4000

# CMD ["node", "dist/server.js"]
# Build stage

FROM node:20-alpine AS builder

WORKDIR /app
RUN addgroup -g 1001 eddy-booking && \
    adduser -S eddy-booking -u 1001 -G eddy-booking

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared

RUN npm ci --workspace=@booking/shared --include-workspace-root
RUN npm run build -w @booking/shared

COPY packages/availability-worker         ./packages/availability-worker
COPY packages/campaign-worker             ./packages/campaign-worker
COPY packages/csv-room-import-worker      ./packages/csv-room-import-worker
COPY packages/seller-notification-worker  ./packages/seller-notification-worker
COPY packages/audit-worker                ./packages/audit-worker
COPY packages/booking-expiry-worker       ./packages/booking-expiry-worker

RUN npm ci \
  --workspace=@booking/availability-worker \
  --workspace=@booking/campaign-worker \
  --workspace=@booking/csv-room-import-worker \
  --workspace=@booking/seller-notification-worker \
  --workspace=@booking/audit-worker \
  --workspace=@booking/booking-expiry-worker \
  --include-workspace-root

RUN npm run build -w @booking/availability-worker && \
    npm run build -w @booking/campaign-worker && \
    npm run build -w @booking/csv-room-import-worker && \
    npm run build -w @booking/seller-notification-worker && \
    npm run build -w @booking/audit-worker && \
    npm run build -w @booking/booking-expiry-worker

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/src ./src
COPY backend/tsconfig.json ./

RUN npx tsc
RUN cp -r src/domains/notification/templates dist/domains/notification/templates
RUN cp -r src/migrations/sql dist/migrations/sql

# Production stage
FROM node:20-alpine

WORKDIR /app/backend
RUN addgroup -g 1001 eddy-booking && \
    adduser -S eddy-booking -u 1001 -G eddy-booking

RUN apk add --no-cache \
    curl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist         ./packages/shared/dist
COPY --from=builder /app/packages/availability-worker/package.json ./packages/availability-worker/package.json
COPY --from=builder /app/packages/availability-worker/dist         ./packages/availability-worker/dist
COPY --from=builder /app/packages/campaign-worker/package.json     ./packages/campaign-worker/package.json
COPY --from=builder /app/packages/campaign-worker/dist             ./packages/campaign-worker/dist
COPY --from=builder /app/packages/csv-room-import-worker/package.json ./packages/csv-room-import-worker/package.json
COPY --from=builder /app/packages/csv-room-import-worker/dist         ./packages/csv-room-import-worker/dist
COPY --from=builder /app/packages/seller-notification-worker/package.json ./packages/seller-notification-worker/package.json
COPY --from=builder /app/packages/seller-notification-worker/dist         ./packages/seller-notification-worker/dist
COPY --from=builder /app/packages/audit-worker/package.json        ./packages/audit-worker/package.json
COPY --from=builder /app/packages/audit-worker/dist                ./packages/audit-worker/dist
COPY --from=builder /app/packages/booking-expiry-worker/package.json ./packages/booking-expiry-worker/package.json
COPY --from=builder /app/packages/booking-expiry-worker/dist         ./packages/booking-expiry-worker/dist


RUN npm install --omit=dev \
  --workspace=@booking/shared \
  --workspace=@booking/availability-worker \
  --workspace=@booking/campaign-worker \
  --workspace=@booking/csv-room-import-worker \
  --workspace=@booking/seller-notification-worker \
  --workspace=@booking/audit-worker \
  --workspace=@booking/booking-expiry-worker \
  --include-workspace-root

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx && \
    apk upgrade --no-cache

COPY --from=builder /app/backend/dist ./dist
COPY backend/src/assets /app/assets
USER eddy-booking

EXPOSE 4000

CMD ["node", "dist/server.js"]