FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/alerts-service ./apps/alerts-service
RUN pnpm install --frozen-lockfile
RUN cd apps/alerts-service && npx prisma generate
RUN pnpm --filter alerts-service run build
ENV CI=true
RUN pnpm install --prod --frozen-lockfile

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/alerts-service/dist ./apps/alerts-service/dist
COPY --from=builder /app/apps/alerts-service/package.json ./apps/alerts-service/package.json
COPY --from=builder /app/apps/alerts-service/src/generated ./apps/alerts-service/dist/generated

EXPOSE 3001
CMD ["node", "apps/alerts-service/dist/index.js"]
