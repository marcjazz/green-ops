# GEMINI.md

## Project Overview
**GreenOps Platform** is a cloud-native SaaS application designed to monitor and visualize energy consumption metrics. It follows a microservices architecture implemented as a **pnpm workspace**.

### Main Technologies
- **Monorepo Management**: pnpm Workspaces
- **Frontend**: React (TypeScript)
- **Backend**: Node.js + Express (TypeScript)
- **Linting & Formatting**: [Biome](https://biomejs.dev/)
- **Data Layer**: PostgreSQL, Redis
- **Infrastructure**: Docker, Kubernetes, Nginx
- **Monitoring**: Prometheus, Grafana
- **CI/CD**: GitHub Actions

## Workspace Structure
- `apps/frontend`: React client application.
- `apps/alerts-service`: Manages energy alerts (Express + Prisma).
- `apps/user-service`: Manages user profiles and preferences (Express + Prisma).
- `packages/shared`: Shared TypeScript types and Zod schemas.
- `infrastructure/docker`: Docker Compose and Prometheus configurations.

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
- **Authentication**: All protected routes require a JWT token validated by the Auth Service.
- **Monitoring**: Services should expose a `/health` endpoint and metrics for Prometheus.
- **CI/CD**: GitHub Actions is used for automated testing, building Docker images, and deployment validation.

## Key Files
- `README.md`: Comprehensive technical documentation of the project.
- `Cahier des charges - Docker et Kubernetes.pdf`: Functional and technical requirements document.
