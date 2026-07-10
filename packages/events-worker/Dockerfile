# ---- deps stage
FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/events-worker/package.json ./packages/events-worker/package.json

RUN npm ci


# ---- builder stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/events-worker ./packages/events-worker

RUN npm run build -w @booking/shared
RUN npm run build -w @booking/events-worker


# ---- prod-deps stage
FROM node:20-alpine AS prod-deps

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/events-worker/package.json ./packages/events-worker/package.json

RUN npm ci --omit=dev --workspace=@booking/events-worker --workspace=@booking/shared


# ---- final stage
FROM node:20-alpine

WORKDIR /app
RUN addgroup -g 1001 eddy-booking && \
    adduser -S eddy-booking -u 1001 -G eddy-booking

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder   /app/packages/shared/dist ./node_modules/@booking/shared/dist
COPY --from=builder   /app/packages/shared/package.json ./node_modules/@booking/shared/package.json
COPY --from=builder   /app/packages/events-worker/dist ./dist
COPY --from=builder   /app/packages/events-worker/package.json ./package.json

USER eddy-booking
CMD ["node", "dist/index.js"]