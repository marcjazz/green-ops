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
ENV CI=true

# Copy package files needed for production install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/user-service/package.json ./apps/user-service/package.json

# Install production dependencies directly in the final stage
RUN pnpm install --prod --frozen-lockfile --filter user-service

# Copy built artifacts and prisma generated client
COPY --from=builder /app/apps/user-service/dist ./apps/user-service/dist
COPY --from=builder /app/apps/user-service/prisma ./apps/user-service/prisma
COPY --from=builder /app/apps/user-service/src/generated ./apps/user-service/dist/generated

EXPOSE 3003
CMD ["node", "apps/user-service/dist/index.js"]
