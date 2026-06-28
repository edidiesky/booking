# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN addgroup -g 1001 booking && \
    adduser -S booking -u 1001 -G booking

COPY package.json package-lock.json ./

RUN apk add --no-cache curl && npm ci

COPY src ./src
COPY tsconfig.json ./

RUN npx tsc

RUN cp -r src/domains/notification/templates dist/domains/notification/templates

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN addgroup -g 1001 booking && \
    adduser -S booking -u 1001 -G booking

RUN apk add --no-cache curl

COPY package.json package-lock.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER booking

EXPOSE 4000

CMD ["node", "dist/server.js"]