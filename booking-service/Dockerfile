FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY booking-service/package.json ./booking-service/package.json

RUN npm install --workspace=@booking/shared --workspace=@booking/booking-service --include-workspace-root

COPY booking-service/tsconfig.json ./booking-service/tsconfig.json
COPY booking-service/src ./booking-service/src

RUN npm run build -w @booking/shared \
 && cd booking-service && npx tsc -p tsconfig.json

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl \
 && addgroup -g 1001 app && adduser -S app -u 1001 -G app

COPY package.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY booking-service/package.json ./booking-service/package.json

RUN npm install --omit=dev --workspace=@booking/shared --workspace=@booking/booking-service --include-workspace-root

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/booking-service/dist ./booking-service/dist

WORKDIR /app/booking-service
USER app
EXPOSE 4101
CMD ["node", "dist/index.js"]
