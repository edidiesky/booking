# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
RUN addgroup -g 1001 eddy-booking && \
    adduser -S eddy-booking -u 1001 -G eddy-booking
COPY package.json package-lock.json ./
RUN npm ci

COPY src ./src
COPY tsconfig.json ./

RUN npx tsc
RUN cp -r src/domains/notification/templates dist/domains/notification/templates


# Production stage
FROM node:20-alpine

WORKDIR /app
RUN addgroup -g 1001 eddy-booking && \
    adduser -S eddy-booking -u 1001 -G eddy-booking

RUN apk add --no-cache \
    curl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY src/assets ./assets

USER eddy-booking

EXPOSE 4000

CMD ["node", "dist/server.js"]