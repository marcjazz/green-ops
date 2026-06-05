# GEMINI.md

## Project Overview
**GreenOps Platform** is a cloud-native SaaS application designed to monitor and visualize energy consumption metrics. It follows a microservices architecture implemented as a **pnpm workspace**.

### Main Technologies
- **Monorepo Management**: pnpm Workspaces
- **Frontend**: React (TypeScript)
- **Backend**: Node.js + Express (TypeScript)
- **Linting & Formatting**: [Biome](https://biomejs.dev/)
- **Data Layer**: PostgreSQL, Redis (cache, alert dedup, rate limiting)
- **Infrastructure**: Docker, Kubernetes, Nginx
- **Monitoring**: Prometheus, Grafana
- **CI/CD**: GitHub Actions

## Workspace Structure
- `apps/frontend`: React client application.
- `apps/alerts-service`: Manages energy alerts (Express + Prisma).
- `apps/user-service`: Manages user profiles and preferences (Express + Prisma).
- `packages/shared`: Shared TypeScript types and Zod schemas.
- `infrastructure/docker`: Docker Compose and Prometheus configurations.
- `infrastructure/k8s`: Kubernetes manifests and deploy script.
- `infrastructure/grafana`: Grafana auto-provisioning (datasource, dashboard provider, dashboard JSON).

## Building and Running
### Local Development
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Run database migrations (example for alerts):
   ```bash
   cd apps/alerts-service && npx prisma db push
   ```
3. Start services in dev mode:
   ```bash
   pnpm --filter alerts-service dev
   pnpm --filter user-service dev
   ```

### Docker
To start the entire stack (including Keycloak, Prometheus, and Grafana):
```bash
cd infrastructure/docker
docker compose up -d --build
```

## Accessing the Platform
Add the following to your `/etc/hosts` file (or equivalent):
```text
127.0.0.1 greenops.local
127.0.0.1 accounts.greenops.local
127.0.0.1 monitor.greenops.local
```

Once configured, access the services via:
- **Frontend**: `http://greenops.local`
- **Keycloak**: `http://accounts.greenops.local`
- **Grafana**: `http://monitor.greenops.local`
```

### Kubernetes
To deploy to a Kubernetes cluster:
```bash
kubectl apply -f k8s/
```
*Verification:*
```bash
kubectl get pods
kubectl get services
kubectl get ingress
```

## Development Conventions
- **Microservices**: Each service should follow a consistent structure (Express.js).
- **Authentication**: All protected routes require a JWT token validated against Keycloak's JWKS endpoint.
- **Monitoring**: Services expose a `/health` endpoint and Prometheus metrics at `/metrics` via `prom-client`.
- **Caching / Rate Limiting**: Redis-backed via `ioredis` with `lazyConnect` (server starts before Redis).
- **Alert Dedup**: Redis `SET NX EX` prevents duplicate alert records within configurable TTLs.
- **CI/CD**: GitHub Actions is used for automated testing, building Docker images, and deployment validation.

## Key Files
- `README.md`: Comprehensive technical documentation of the project.
- `Cahier des charges - Docker et Kubernetes.pdf`: Functional and technical requirements document.
- `infrastructure/grafana/dashboards/greenops-overview.json`: Provisioned Grafana dashboard (12 panels covering Node.js, PostgreSQL, Keycloak, Nginx).
- `infrastructure/grafana/provisioning/`: Auto-provisioning configs for Prometheus datasource and dashboard loader.
- `infrastructure/k8s/deploy.sh`: One-command script to deploy the full stack to Minikube.
- `apps/alerts-service/src/monitor.ts`: Internal Prometheus alert monitor (polls API every 30s, creates alert records via Prisma).
