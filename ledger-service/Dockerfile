FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY ledger-service/package.json ./ledger-service/package.json

RUN npm install --workspace=@booking/shared --workspace=@booking/ledger-service --include-workspace-root

COPY ledger-service/tsconfig.json ./ledger-service/tsconfig.json
COPY ledger-service/src ./ledger-service/src
COPY ledger-service/db ./ledger-service/db


RUN npm run build -w @booking/shared \
 && cd ledger-service && npx tsc -p tsconfig.json

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl \
 && addgroup -g 1001 app && adduser -S app -u 1001 -G app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY ledger-service/package.json ./ledger-service/package.json

RUN npm install --omit=dev --workspace=@booking/shared --workspace=@booking/ledger-service --include-workspace-root

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/ledger-service/dist ./ledger-service/dist
COPY --from=builder /app/ledger-service/db ./ledger-service/db

WORKDIR /app/ledger-service
USER app
EXPOSE 4103
CMD ["node", "dist/index.js"]
