FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared ./packages/shared
COPY apps/alerts-service ./apps/alerts-service
RUN pnpm install --frozen-lockfile
RUN pnpm --filter alerts-service run build

FROM node:20-slim
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/alerts-service/dist ./apps/alerts-service/dist
COPY --from=builder /app/apps/alerts-service/package.json ./apps/alerts-service/package.json
COPY --from=builder /app/apps/alerts-service/prisma ./apps/alerts-service/prisma

EXPOSE 3001
CMD ["pnpm", "--filter", "alerts-service", "run", "start"]
