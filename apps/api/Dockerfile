# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json ./
COPY tsconfig.base.json ./

# Copy package files
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/ai-client/package.json ./packages/ai-client/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install

# Copy source files
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY packages/ai-client ./packages/ai-client
COPY apps/api ./apps/api

# Generate Prisma client
RUN pnpm --filter @i2k/database generate

# Build packages
RUN pnpm --filter @i2k/shared build
RUN pnpm --filter @i2k/ai-client build
RUN pnpm --filter @i2k/api build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

WORKDIR /app

# Install production dependencies only
COPY --from=builder /app/pnpm-workspace.yaml /app/pnpm-lock.yaml* /app/package.json ./
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/ai-client/package.json ./packages/ai-client/
COPY --from=builder /app/apps/api/package.json ./apps/api/

RUN pnpm install --prod

# Copy built files
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/ai-client/dist ./packages/ai-client/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Generate Prisma client for production
RUN pnpm --filter @i2k/database generate

# Create uploads directory
RUN mkdir -p /app/uploads

# Set environment
ENV NODE_ENV=production

EXPOSE 3000

# Run migrations and start
CMD ["sh", "-c", "pnpm --filter @i2k/database migrate:deploy && node apps/api/dist/server.js"]
