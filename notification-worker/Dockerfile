FROM node:20-alpine AS builder
WORKDIR /app/notification-worker
COPY notification-worker/package.json ./
RUN npm install
COPY notification-worker/tsconfig.json ./
COPY notification-worker/src ./src
RUN npx tsc

FROM node:20-alpine
WORKDIR /app/notification-worker
RUN addgroup -g 1001 app && adduser -S app -u 1001 -G app
COPY notification-worker/package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/notification-worker/dist ./dist
USER app
CMD ["node", "dist/index.js"]
