FROM node:20-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/user-service ./apps/user-service
RUN pnpm install --frozen-lockfile
RUN cd apps/user-service && npx prisma generate
RUN pnpm --filter user-service run build
ENV CI=true
RUN pnpm install --prod --frozen-lockfile

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/user-service/dist ./apps/user-service/dist
COPY --from=builder /app/apps/user-service/package.json ./apps/user-service/package.json
COPY --from=builder /app/apps/user-service/src/generated ./apps/user-service/dist/generated

EXPOSE 3003
CMD ["node", "apps/user-service/dist/index.js"]
