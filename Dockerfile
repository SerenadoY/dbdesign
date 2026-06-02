# Dockerfile
# Multi-stage: build client, then serve from Express in production

# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci

# Increase memory for Vite/ESBuild transform
ENV NODE_OPTIONS="--max-old-space-size=8192"

COPY client/ ./
RUN npm run build

# ---- Runtime Stage ----
FROM node:20-alpine

RUN apk add --no-cache tini

ENV NODE_ENV=production

WORKDIR /app/server

# Copy server source
COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ ./

# Copy built client from builder
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/index.js"]
