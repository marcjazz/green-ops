FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/user-service ./apps/user-service
RUN pnpm install --frozen-lockfile
RUN cd apps/user-service && npx prisma generate
RUN pnpm --filter user-service run build

FROM node:20-slim
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/user-service/dist ./apps/user-service/dist
COPY --from=builder /app/apps/user-service/package.json ./apps/user-service/package.json
COPY --from=builder /app/apps/user-service/prisma ./apps/user-service/prisma
COPY --from=builder /app/apps/user-service/src/generated ./apps/user-service/src/generated

EXPOSE 3003
CMD ["pnpm", "--filter", "user-service", "run", "start"]
