# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
RUN addgroup -g 1001 gateway && \
    adduser -S gateway -u 1001 -G gateway

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared

RUN npm ci --workspace=@booking/shared --include-workspace-root
RUN npm run build -w @booking/shared

WORKDIR /app/gateway
COPY gateway/package.json gateway/package-lock.json ./
RUN npm ci

COPY gateway/src ./src
COPY gateway/tsconfig.json ./

RUN npx tsc

# Production stage
FROM node:20-alpine

WORKDIR /app/gateway
RUN addgroup -g 1001 gateway && \
    adduser -S gateway -u 1001 -G gateway

COPY --from=builder /app/packages/shared/package.json /app/packages/shared/package.json
COPY --from=builder /app/packages/shared/dist         /app/packages/shared/dist
WORKDIR /app/packages/shared
RUN npm install --omit=dev

WORKDIR /app/gateway
COPY gateway/package.json gateway/package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/gateway/dist ./dist
USER gateway

EXPOSE 8080

CMD ["node", "dist/server.js"]