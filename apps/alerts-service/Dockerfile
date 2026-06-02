FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/alerts-service ./apps/alerts-service
RUN pnpm install --frozen-lockfile
# Build shared first
RUN pnpm --filter shared run build
# Generate prisma and build app
RUN cd apps/alerts-service && npx prisma generate
RUN pnpm --filter alerts-service run build

FROM node:20-slim
WORKDIR /app
RUN npm install -g pnpm
ENV CI=true

# Copy package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/alerts-service/package.json ./apps/alerts-service/package.json

# Install prod deps and link local packages
COPY packages/shared ./packages/shared
RUN pnpm install --prod --frozen-lockfile --filter alerts-service --filter shared

# Copy built artifacts
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/alerts-service/dist ./apps/alerts-service/dist
COPY --from=builder /app/apps/alerts-service/prisma ./apps/alerts-service/prisma
COPY --from=builder /app/apps/alerts-service/src/generated ./apps/alerts-service/dist/generated

EXPOSE 3001
CMD ["node", "apps/alerts-service/dist/index.js"]
