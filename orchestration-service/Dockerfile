FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY orchestration-service/package.json ./orchestration-service/package.json

RUN npm install --workspace=@booking/shared --workspace=@booking/orchestration-service --include-workspace-root

COPY orchestration-service/tsconfig.json ./orchestration-service/tsconfig.json
COPY orchestration-service/src ./orchestration-service/src

RUN npm run build -w @booking/shared \
 && cd orchestration-service && npx tsc -p tsconfig.json

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl \
 && addgroup -g 1001 app && adduser -S app -u 1001 -G app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY orchestration-service/package.json ./orchestration-service/package.json

RUN npm install --omit=dev --workspace=@booking/shared --workspace=@booking/orchestration-service --include-workspace-root

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/orchestration-service/dist ./orchestration-service/dist

WORKDIR /app/orchestration-service
USER app
EXPOSE 4104
CMD ["node", "dist/index.js"]
