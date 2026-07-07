# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
RUN addgroup -g 1001 eddy-booking && \
    adduser -S eddy-booking -u 1001 -G eddy-booking

COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/booking-expiry-worker ./packages/booking-expiry-worker

RUN npm ci
RUN npm run build -w @booking/shared
RUN npm run build -w @booking/booking-expiry-worker


# Production stage
FROM node:20-alpine

WORKDIR /app
RUN addgroup -g 1001 eddy-booking && \
    adduser -S eddy-booking -u 1001 -G eddy-booking

COPY --from=builder /app/packages/shared/dist ./node_modules/@booking/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@booking/shared/package.json
COPY --from=builder /app/packages/booking-expiry-worker/dist ./dist
COPY --from=builder /app/packages/booking-expiry-worker/package.json ./package.json

RUN npm ci --only=production && npm cache clean --force

USER eddy-booking

CMD ["node", "dist/index.js"]