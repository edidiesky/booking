# ---- deps stage
FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/audit-worker/package.json ./packages/audit-worker/package.json

RUN npm ci


# ---- builder stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/audit-worker ./packages/audit-worker

RUN npm run build -w @booking/shared
RUN npm run build -w @booking/audit-worker


# ---- prod-deps stage
FROM node:20-alpine AS prod-deps

WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/audit-worker/package.json ./packages/audit-worker/package.json

RUN npm ci --omit=dev --workspace=@booking/audit-worker --workspace=@booking/shared


# ---- final stage
FROM node:20-alpine

WORKDIR /app
RUN addgroup -g 1001 eddy-booking && \
    adduser -S eddy-booking -u 1001 -G eddy-booking

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder   /app/packages/shared/dist ./node_modules/@booking/shared/dist
COPY --from=builder   /app/packages/shared/package.json ./node_modules/@booking/shared/package.json
COPY --from=builder   /app/packages/audit-worker/dist ./dist
COPY --from=builder   /app/packages/audit-worker/package.json ./package.json

USER eddy-booking
CMD ["node", "dist/index.js"]