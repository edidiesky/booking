FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY payment-service/package.json ./payment-service/package.json

RUN npm install --workspace=@booking/shared --workspace=@booking/payment-service --include-workspace-root

COPY payment-service/tsconfig.json ./payment-service/tsconfig.json
COPY payment-service/src ./payment-service/src

RUN npm run build -w @booking/shared \
 && cd payment-service && npx tsc -p tsconfig.json

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl \
 && addgroup -g 1001 app && adduser -S app -u 1001 -G app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY payment-service/package.json ./payment-service/package.json

RUN npm install --omit=dev --workspace=@booking/shared --workspace=@booking/payment-service --include-workspace-root

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/payment-service/dist ./payment-service/dist

WORKDIR /app/payment-service
USER app
EXPOSE 4102
CMD ["node", "dist/index.js"]
