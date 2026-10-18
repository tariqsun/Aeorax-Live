# Aeorax Live — Production Multi-stage Dockerfile
# Base: Node 22 Alpine for minimum image size & maximum security

FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production

# 1. Dependencies Stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --omit=dev

# 2. Builder Stage
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# 3. Production Runner Stage
FROM base AS runner
WORKDIR /app
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user for container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
