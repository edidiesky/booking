# # Build stage
# FROM node:20-alpine AS builder

# WORKDIR /app
# RUN addgroup -g 1001 eddy-booking && \
#     adduser -S eddy-booking -u 1001 -G eddy-booking

# # Root workspace files needed to resolve packages/shared as a workspace member
# COPY package.json package-lock.json tsconfig.base.json ./
# COPY packages/shared ./packages/shared

# RUN npm ci --workspace=@booking/shared --include-workspace-root
# RUN npm run build -w @booking/shared

# WORKDIR /app/backend
# COPY backend/package.json backend/package-lock.json ./
# RUN npm ci

# COPY backend/src ./src
# COPY backend/tsconfig.json ./

# RUN npx tsc
# RUN cp -r src/domains/notification/templates dist/domains/notification/templates


# # Production stage
# FROM node:20-alpine

# WORKDIR /app/backend
# RUN addgroup -g 1001 eddy-booking && \
#     adduser -S eddy-booking -u 1001 -G eddy-booking

# RUN apk add --no-cache \
#     curl \
#     chromium \
#     nss \
#     freetype \
#     harfbuzz \
#     ca-certificates \
#     ttf-freefont

# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# COPY --from=builder /app/packages/shared /app/packages/shared
# COPY backend/package.json backend/package-lock.json ./
# RUN npm ci --only=production && npm cache clean --force

# COPY --from=builder /app/backend/dist ./dist
# COPY backend/src/assets ./assets

# USER eddy-booking

# EXPOSE 4000

# CMD ["node", "dist/server.js"]

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
RUN addgroup -g 1001 eddy-booking && \
    adduser -S eddy-booking -u 1001 -G eddy-booking

# Root workspace files needed to resolve packages/shared as a workspace member
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared

RUN npm ci --workspace=@booking/shared --include-workspace-root
RUN npm run build -w @booking/shared

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/src ./src
COPY backend/tsconfig.json ./

RUN npx tsc
RUN cp -r src/domains/notification/templates dist/domains/notification/templates
RUN cp -r src/migrations/sql dist/migrations/sql

# Production stage
FROM node:20-alpine

WORKDIR /app/backend
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

COPY --from=builder /app/packages/shared/package.json /app/packages/shared/package.json
COPY --from=builder /app/packages/shared/dist         /app/packages/shared/dist
WORKDIR /app/packages/shared
RUN npm install --omit=dev

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/backend/dist ./dist
COPY backend/src/assets /app/assets
USER eddy-booking

EXPOSE 4000

CMD ["node", "dist/server.js"]