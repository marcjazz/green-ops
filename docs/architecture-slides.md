---
marp: true
theme: uncover
class: invert
paginate: true
---

# <!--fit--> GreenOps Platform
## Architecture Overview

---

# Architecture at a Glance

| Layer | Technology |
|-------|-----------|
| **Frontend** | React SPA (Vite + TypeScript) served by Nginx |
| **API Gateway** | Nginx reverse proxy (single entry point) |
| **Identity** | Keycloak (OIDC / JWT) |
| **Backend** | alerts-service, user-service (Node.js + Express) |
| **Database** | PostgreSQL (multi-schema) |
| **Monitoring** | Prometheus + Grafana |
| **Orchestration** | Docker Compose / Kubernetes (Minikube) |

---

![width:900](arch-diagram.svg)

---

# Request Flow

```
                      ┌─────────────────┐
                      │   Keycloak       │
                      │  accounts.*      │
                      └────────┬────────┘
                               │ OIDC
┌──────────┐  HTTPS   ┌───────▼────────┐
│  Browser │──────────►│    Nginx       │
│ (React)  │◄──────────│  (reverse      │
└──────────┘          │   proxy + TLS)  │
                      └───┬───┬───┬────┘
                          │   │   │
          ┌───────────────┘   │   └──────────────┐
          ▼                   ▼                   ▼
   ┌────────────┐    ┌──────────────┐    ┌──────────────┐
   │  alerts-   │    │  user-       │    │  Prometheus   │
   │  service   │    │  service     │    │  (proxy)      │
   │  :3001     │    │  :3003       │    │  :9090        │
   └──────┬─────┘    └──────┬───────┘    └──────────────┘
          │                 │
          └────────┬────────┘
                   ▼
          ┌────────────────┐
          │   PostgreSQL   │
          │  (multi-schema)│
          └────────────────┘
```

---

# Nginx Routing

| Server Name | Role |
|------------|------|
| `greenops.local` | Frontend + API |
| `accounts.greenops.local` | Keycloak |
| `monitor.greenops.local` | Grafana |

**API routes:**
- `/api/alerts/*` → `alerts-service:3001`
- `/api/user/*` → `user-service:3003/profile/*`
- `/api/prometheus/*` → `prometheus:9090`

---

# Keycloak — Identity Provider

- OpenID Connect (OIDC) provider at `https://accounts.greenops.local`
- Pre-configured `greenops` realm (imported from `realm.json`)
- Clients: `greenops-frontend` (public), `greenops-grafana` (confidential)
- Metrics enabled (`KC_METRICS_ENABLED=true`) for Prometheus scraping
- JWT signing keys fetched via JWKS URI
- CORS configured for `https://greenops.local`

---

# Frontend — React SPA

| Aspect | Detail |
|--------|--------|
| **Build** | Vite + React 19 (TypeScript) |
| **Docker** | Multi-stage, served by Nginx |
| **Auth** | `react-oidc-context` for Keycloak |
| **API calls** | Axios with JWT interceptor |

**Pages:**
- **Dashboard** — alert count, theme, scrape durations, recent alerts
- **Services** — live up/down status via Prometheus `up` metric

---

# alerts-service

- **Language:** Node.js + Express 5 (TypeScript) — Port `3001`
- **Endpoints:** `GET/POST /alerts`, `PATCH /:id/read`, `/health`, `/metrics`
- **Background monitor** (`src/monitor.ts`):
  1. Queries Prometheus every 30s for alerting rules
  2. Creates `Alert` record in PostgreSQL when threshold exceeded
  3. Marks pending alerts as read when metric normalizes

**Alert rules:** service offline detection, high scrape duration warnings

---

# user-service

- **Language:** Node.js + Express 5 (TypeScript) — Port `3003`
- **Endpoints:** `GET/PATCH /profile`, `/health`, `/metrics`
- Profiles indexed by JWT `sub` claim (Keycloak user ID)
- Graceful fallback: search by email if `sub` not found

**Profile fields:** theme, notifications, dashboard layout

---

# PostgreSQL — Multi-Schema Design

```sql
-- Schema: users (user-service)
CREATE TABLE users."UserProfile" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "keycloakId" TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    theme TEXT NOT NULL DEFAULT 'light',
    notifications BOOLEAN NOT NULL DEFAULT true,
    "dashboardLayout" JSONB,
    ...
);

-- Schema: alerts (alerts-service)
CREATE TABLE alerts."Alert" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity alerts."Severity" NOT NULL DEFAULT 'info',
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    threshold DOUBLE PRECISION NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    ...
);
```

---

# Prometheus — Monitoring

- **Image:** `prom/prometheus`, Port: `9090` (internal)
- **Scrape interval:** every 15s

| Job | Target |
|-----|--------|
| `prometheus` | `localhost:9090` |
| `alerts-service` | `alerts-service:3001` |
| `user-service` | `user-service:3003` |
| `postgres-exporter` | `postgres-exporter:9187` |
| `keycloak` | `keycloak:8080/metrics` |
| `nginx-exporter` | `nginx-exporter:9113` |

Frontend queries Prometheus via Nginx proxy for `scrape_duration_seconds` and `up`.

---

# Grafana — Dashboards

- **Image:** `grafana/grafana`, Port: `3000` (internal)
- **Auth:** OIDC via Keycloak (`greenops-grafana` client)
- **Access:** `https://monitor.greenops.local`

Available at `docs/grafana-dashboards/` — ready-to-import JSON dashboards.

---

# nginx-exporter

- **Image:** `nginx/nginx-prometheus-exporter:latest`
- **Port:** `9113` (internal)
- **Scrapes:** Nginx stub_status on port `8081`

Exposes Nginx connection metrics to Prometheus.
- Docker: separate service in compose.yml
- Kubernetes: sidecar container in the frontend pod

---

# Infrastructure — Docker

```
# Generate TLS certs (once)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infrastructure/docker/certs/nginx.key \
  -out    infrastructure/docker/certs/nginx.crt \
  -subj  "/CN=greenops.local" \
  -addext "subjectAltName=DNS:greenops.local,..."

# Start all services
docker compose -f infrastructure/docker/compose.yml up -d --build

# /etc/hosts entries
127.0.0.1  greenops.local
127.0.0.1  accounts.greenops.local
127.0.0.1  monitor.greenops.local
```

---

# Infrastructure — Kubernetes (Minikube)

```
# Deploy everything
bash infrastructure/k8s/deploy.sh

# Start LoadBalancer tunnel
minikube tunnel

# Update /etc/hosts with EXTERNAL-IP from:
kubectl get svc frontend -n greenops
```

**Deployments:** postgres, keycloak, prometheus, grafana, alerts-service, user-service, frontend + postgres-exporter + nginx-exporter

---

# Kubernetes Architecture

```
                                    ┌──────────────┐
                                    │  Keycloak    │
                                    │  ClusterIP   │
                                    └──────┬───────┘
                                           │
┌──────────┐  HTTPS   ┌────────────────────▼────────┐
│  Browser │──────────►│  frontend (LoadBalancer)    │
│          │◄──────────│  ├─ nginx (reverse proxy)  │
└──────────┘           │  └─ SPA (static files)     │
                       └───┬───┬───┬────┬────┬──────┘
                           │   │   │    │    │
          ┌────────────────┘   │   │    │    └───────────┐
          ▼                    ▼   │    ▼                ▼
   ┌───────────┐      ┌──────────┐ │ ┌──────────┐ ┌──────────┐
   │  alerts-  │      │   user-  │ │ │Prometheus│ │  Grafana │
   │  service  │      │  service │ │ │ClusterIP │ │ClusterIP │
   │ ClusterIP │      │ ClusterIP│ │ │  :9090   │ │  :3000   │
   └─────┬─────┘      └────┬─────┘ │ └──────────┘ └──────────┘
         │                 │       │
         └────────┬────────┘       │
                  ▼                │
         ┌──────────────┐          │
         │  PostgreSQL   │         │
         │  ClusterIP    │         │
         │  :5432        │         │
         └──────────────┘          │
                                   ▼
                          ┌──────────────────┐
                          │   postgres-       │
                          │   exporter        │
                          │   ClusterIP :9187 │
                          └──────────────────┘
```

---

# CI/CD Pipelines

**CI** (push/PR to `main`/`master`):
1. `pnpm install --frozen-lockfile`
2. `pnpm biome ci .` — lint & format
3. Build `shared` package
4. Type-check each service sequentially

**Publish** (push to `main` or `v*` tag):
- Builds & pushes 3 images to GHCR:
  - `frontend`, `alerts-service`, `user-service`
- Tags: `latest`, `sha-<short>`, semver

---

# Docker vs Kubernetes

| Aspect | Docker | K8s |
|--------|--------|-----|
| Config files | `infrastructure/docker/` | `infrastructure/k8s/` |
| TLS certs | Persistent in `certs/` (committed) | Generated at deploy |
| Entry point | `compose.yml` | `deploy.sh` |
| Frontend | Port mapping | LoadBalancer + tunnel |
| PostgreSQL data | Named volume `postgres_data` | PVC `postgres-pvc` (1Gi) |

---

<!-- _class: invert -->
# <!--fit--> Thank You

**GreenOps** — Cloud-native Energy Monitoring Platform

Marco KUIDJA · Moussa TOURE · Wilfried MAILLET
