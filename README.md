# GreenOps Platform

## Technical Documentation

### Authors

* Marco KUIDJA
* Moussa TOURE
* Wilfried MAILLET

### Version

1.0

---

# 1. Project Overview

## Context

GreenOps Platform is a cloud-native SaaS application designed to monitor and visualize energy consumption metrics through a modern web interface.

The project demonstrates the implementation of modern DevOps practices including:

* Microservices architecture
* Docker containerization
* Kubernetes orchestration
* Monitoring and observability
* Infrastructure resilience
* CI/CD automation

---

# 2. Objectives

The platform aims to:

* Monitor energy metrics
* Display dashboards and statistics
* Manage user authentication
* Generate alerts
* Demonstrate a production-ready containerized infrastructure

---

# 3. Global Architecture

## Architecture Diagram

```text
                         ┌─────────────┐
                         │   Frontend  │
                         │   React     │
                         └──────┬──────┘
                                │
                                ▼
                         ┌─────────────┐
                         │    Nginx    │
                         │  Reverse    │
                         │   Proxy     │
                         └──┬──────┬───┘
                            │      │
          ┌─────────────────┼──────┼──────────────────┐
          │                 │      │                  │
          ▼                 ▼      ▼                  ▼

  ┌─────────────┐   ┌─────────────┐          ┌──────────────┐
  │   Keycloak  │   │  Alerts     │          │   User       │
  │   OIDC      │   │  Service    │          │   Service    │
  └──────┬──────┘   └──────┬──────┘          └──────┬───────┘
         │                 │                        │
         └─────────┬───────┴────────────────────────┘
                   │
                   ▼

         ┌──────────────────┐
         │    PostgreSQL    │
         │  (alerts + users)│
         └──────────────────┘

                   │
                   ▼

  ┌─────────────┐   ┌──────────────┐   ┌────────────┐
  │  Prometheus │   │    Redis     │   │   Grafana  │
  │   + Exporter│   │  Cache /     │   │  (auto-    │
  │             │   │  Rate limit  │   │  provision)│
  └─────────────┘   └──────────────┘   └────────────┘
```

---

# 4. Technology Stack

## Frontend

| Component   | Technology   |
| ----------- | ------------ |
| UI          | React        |
| Routing     | React Router |
| HTTP Client | Axios        |

## Backend

| Component        | Technology        |
| ---------------- | ----------------- |
| Alerts Service   | Node.js + Express |
| User Service     | Node.js + Express |

## Identity & Access

| Component | Technology |
| --------- | ---------- |
| OIDC      | Keycloak 24 |

## Data Layer

| Component | Technology        |
| --------- | ----------------- |
| Database  | PostgreSQL 16     |
| Cache     | Redis 7           |

## Infrastructure

| Component        | Technology     |
| ---------------- | -------------- |
| Containerization | Docker         |
| Orchestration    | Kubernetes     |
| Reverse Proxy    | Nginx          |
| Monitoring       | Prometheus     |
| Visualization    | Grafana        |
| CI/CD            | GitHub Actions |

---

# 5. Services Description

## Frontend

React SPA served by nginx. Communicates with backends through the nginx reverse proxy at `/api/alerts/*` and `/api/user/*`. Authentication uses Keycloak OIDC (OpenID Connect) with the `oauth` flow via the `oidc-client-ts` library.

## Alerts Service

Monitors Prometheus metrics and creates alert records.

### Endpoints

```http
GET    /alerts         List all alerts
POST   /alerts         Create an alert
PATCH  /alerts/:id/read  Mark alert as read
GET    /health         Health check
```

## User Service

Manages user profiles synced from Keycloak identity tokens.

### Endpoints

```http
GET    /profile        Get current user profile
PATCH  /profile        Update user profile
GET    /health         Health check
```

## Keycloak

OIDC provider handling authentication and user management.

---

# 6. Database Design

Two schemas are used within a single PostgreSQL database (`greenops_db`):

### Schema: `alerts`

```sql
CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    description     TEXT,
    severity        VARCHAR(10) NOT NULL,
    metric_name     VARCHAR(100),
    metric_value    DOUBLE PRECISION,
    threshold       DOUBLE PRECISION,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Schema: `users`

```sql
CREATE TABLE user_profiles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id VARCHAR(255) UNIQUE,
    email       VARCHAR(255) UNIQUE,
    theme       VARCHAR(20) DEFAULT 'light',
    notifications JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

# 7. Docker Infrastructure

## Services

| Service          | Container            | Port(s)     |
| ---------------- | -------------------- | ----------- |
| Frontend + Nginx | frontend             | 80, 443     |
| Alerts Service   | alerts-service       | 3001        |
| User Service     | user-service         | 3003        |
| Keycloak         | keycloak:24.0        | 8080        |
| PostgreSQL       | postgres:16-alpine   | 5432        |
| Redis            | redis:7-alpine       | 6379        |
| Prometheus       | prom/prometheus      | 9090        |
| Grafana          | grafana/grafana      | 3000        |
| nginx-exporter   | nginx/nginx-prometheus-exporter | 9113 |
| postgres-exporter| prometheuscommunity/postgres-exporter | 9187 |

## Persistent Volumes

```text
postgres_data
redis_data
```

## Grafana Provisioning

Grafana is auto-configured on startup via volume-mounted provisioning files:

| Mount                                      | Purpose                     |
| ------------------------------------------ | --------------------------- |
| `infrastructure/grafana/provisioning/datasources/` | Prometheus datasource |
| `infrastructure/grafana/provisioning/dashboards/`  | Dashboard loader     |
| `infrastructure/grafana/dashboards/`               | Dashboard JSON files |

---

# 8. Monitoring and Observability

## Prometheus

Prometheus scrapes the following targets at `15s` intervals:

| Job                | Target                      | Metrics                                      |
| ------------------ | --------------------------- | -------------------------------------------- |
| `prometheus`       | `localhost:9090`            | Prometheus self-metrics                      |
| `alerts-service`   | `alerts-service:3001`       | Node.js (CPU, memory, event loop, handles)   |
| `user-service`     | `user-service:3003`         | Node.js (CPU, memory, event loop, handles)   |
| `postgres-exporter`| `postgres-exporter:9187`    | PostgreSQL (connections, size, cache hit)     |
| `keycloak`         | `keycloak:8080/metrics`     | JVM (heap, threads, GC, CPU)                 |
| `nginx`            | `nginx-exporter:9113`       | Nginx connections, request rate              |

### Internal Alerting

The alerts-service includes a built-in Prometheus monitor (`src/monitor.ts`) that polls the Prometheus API every 30s and creates alert records in PostgreSQL for:

- **Alerts Service Down** — `up{job="alerts-service"} < 0.5`
- **User Service Down** — `up{job="user-service"} < 0.5`
- **High Scrape Duration** — `scrape_duration_seconds{job="prometheus"} > 1`

Alert deduplication is handled via Redis `SET NX EX` with per-severity TTLs (critical=10min, warning=5min, info=2min).

---

## Grafana

Grafana is deployed with **auto-provisioning** — a Prometheus datasource and dashboard are loaded automatically on startup, no manual configuration needed.

### Access

```
URL:  https://monitor.greenops.local
Auth: Keycloak OIDC (same credentials as the main app)
```

### Dashboard: GreenOps — Service Overview

The dashboard is provisioned from `infrastructure/grafana/dashboards/greenops-overview.json` and contains 12 panels:

| # | Panel                  | Key Query                                              | Source        |
|---|------------------------|--------------------------------------------------------|---------------|
| 1 | Service Health         | `up{job=~"$job"}`                                       | All targets   |
| 2 | Memory Usage           | `process_resident_memory_bytes`                          | Node.js       |
| 3 | Heap Utilization       | `nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes` | Node.js  |
| 4 | CPU Usage              | `rate(process_cpu_user_seconds_total[1m])`               | Node.js       |
| 5 | Event Loop Lag         | `nodejs_eventloop_lag_seconds`                           | Node.js       |
| 6 | Active Requests        | `nodejs_active_requests_total`                           | Node.js       |
| 7 | Postgres Overview      | `pg_stat_activity_count`, `pg_database_size_bytes`       | PostgreSQL    |
| 8 | Scrape Duration        | `scrape_duration_seconds` (table)                        | Prometheus    |
| 9 | Nginx Connections      | `nginx_connections_active / reading / writing / waiting`  | Nginx         |
| 10| Nginx Request Rate     | `rate(nginx_http_requests_total[1m])`                    | Nginx         |
| 11| Keycloak JVM Heap      | `jvm_memory_used_bytes`, `jvm_memory_max_bytes`          | Keycloak      |
| 12| Keycloak CPU & Threads | `system_cpu_usage`, `jvm_threads_live_threads`           | Keycloak      |

The template variable `$job` filters panels 1–6 by service. By default it targets `alerts-service` and `user-service`, but also accepts `postgres-exporter`, `keycloak`, and `nginx`.

---

# 9. Security

## Authentication

OIDC (OpenID Connect) via Keycloak 24.

### Flow

```text
User
  │
  ▼
Keycloak Login (accounts.greenops.local)
  │
  ▼
Access Token (JWT)
  │
  ▼
Nginx proxies requests with Bearer token
  │
  ▼
Backend services validate JWT via JWKS endpoint
```

Keycloak is configured with:
- A realm (`greenops`) with client applications for the frontend and Grafana
- Metrics enabled (`KC_METRICS_ENABLED: "true"`)

Grafana uses OIDC through the `generic_oauth` auth provider, authenticating users against the same Keycloak realm.

---

## Secrets Management

Sensitive values are stored using:

* Environment variables (Docker)
* Kubernetes Secrets

Secret values:

| Secret              | Values                                                           |
| ------------------- | ---------------------------------------------------------------- |
| `greenops-secrets`  | postgres-user, postgres-password, postgres-db, redis-password, grafana-client-secret |
| `nginx-tls`         | nginx.crt, nginx.key (self-signed)                               |

---

# 10. Kubernetes Architecture

## Overview

The Kubernetes deployment mirrors the Docker Compose setup using Minikube.
All manifests are in `infrastructure/k8s/` with K8s-specific config files
(nginx.conf, prometheus.yml, realm.json) tracked separately from the Docker
versions for independent maintenance.

---

## Namespace

All resources are deployed in a single namespace:

```text
greenops
```

---

## Deployments

| Deployment         | Image                                         | Port | Replicas | Probes |
| ------------------ | --------------------------------------------- | ---- | -------- | ------ |
| frontend           | ghcr.io/marcjazz/green-ops/frontend:latest    | 443  | 2        | —      |
| alerts-service     | ghcr.io/marcjazz/green-ops/alerts-service:latest | 3001 | 2      | /health |
| user-service       | ghcr.io/marcjazz/green-ops/user-service:latest   | 3003 | 2    | /health |
| postgres           | postgres:16-alpine                            | 5432 | 1      | pg_isready |
| redis              | redis:7-alpine                                | 6379 | 1      | redis-cli ping |
| postgres-exporter  | prometheuscommunity/postgres-exporter         | 9187 | 1      | —      |
| keycloak           | quay.io/keycloak/keycloak:24.0                | 8080 | 1      | —      |
| prometheus         | prom/prometheus                               | 9090 | 1      | —      |
| grafana            | grafana/grafana                               | 3000 | 1      | —      |

**Note**: Replicas shown are baseline values. Critical services (frontend, alerts-service, user-service) can scale dynamically from2-5 replicas via HPA based on resource utilization.

---

## Horizontal Pod Autoscalers

| HPA                  | Target Deployment   | Min | Max | CPU Target | Memory Target |
| -------------------- | ------------------- | --- | --- | ---------- | ------------- |
| alerts-service-hpa   | alerts-service      | 2   | 5   | 70%        | 80%           |
| user-service-hpa     | user-service        | 2   | 5   | 70%        | 80%           |
| frontend-hpa         | frontend            | 2   | 5   | 70%        | 80%           |

HPA automatically scales pods based on resource utilization to maintain performance under varying loads.

---

## Services

| Service            | Type         | Port(s)               | Purpose |
| ------------------ | ------------ | --------------------- | ------- |
| frontend           | LoadBalancer | 443, 80, 9113         | External entry point (nginx) + nginx-exporter metrics |
| alerts-service     | ClusterIP    | 3001               | Internal API |
| user-service       | ClusterIP    | 3003               | Internal API |
| redis              | ClusterIP    | 6379               | Cache / Dedup / Rate limiting |
| postgres           | ClusterIP    | 5432               | Database |
| postgres-exporter  | ClusterIP    | 9187               | Metrics |
| keycloak           | ClusterIP    | 8080               | OIDC provider |
| prometheus         | ClusterIP    | 9090               | Metrics |
| grafana            | ClusterIP    | 3000               | Dashboards |

The `frontend` LoadBalancer exposes nginx which handles TLS termination and
reverse-proxies API requests to the internal ClusterIP services.

---

## ConfigMaps

ConfigMaps are created from K8s-specific config files in `infrastructure/k8s/`:

| ConfigMap                   | Source File                                          | Mounted In      |
| --------------------------- | ---------------------------------------------------- | --------------- |
| `nginx-config`              | `infrastructure/k8s/nginx.conf`                      | frontend        |
| `prometheus-config`         | `infrastructure/k8s/prometheus.yml`                  | prometheus      |
| `keycloak-realm`            | `infrastructure/k8s/realm.json`                      | keycloak        |
| `grafana-datasource`        | `infrastructure/grafana/provisioning/datasources/`   | grafana         |
| `grafana-dashboard-provider`| `infrastructure/grafana/provisioning/dashboards/`    | grafana         |
| `grafana-dashboard`         | `infrastructure/grafana/dashboards/`                 | grafana         |

The nginx config routes requests by hostname:

| Hostname                    | Route                 | Backend            |
| --------------------------- | --------------------- | ------------------ |
| `greenops.local`            | `/api/alerts/*`       | alerts-service:3001 |
| `greenops.local`            | `/api/user/*`         | user-service:3003  |
| `greenops.local`            | `/api/prometheus/*`   | prometheus:9090    |
| `greenops.local`            | `/` (static files)    | frontend SPA       |
| `accounts.greenops.local`   | `/`                   | keycloak:8080      |
| `monitor.greenops.local`    | `/`                   | grafana:3000       |

---

## Secrets

| Secret              | Contents                                      |
| ------------------- | --------------------------------------------- |
| `greenops-secrets`  | postgres-user, postgres-password, postgres-db, redis-password |
| `nginx-tls`         | nginx.crt, nginx.key (self-signed)            |

Secrets are generated during deployment via `deploy.sh`. TLS certificates are
created on-the-fly with `openssl` and are never committed to the repository.

---

## Storage

PostgreSQL uses a PersistentVolumeClaim (`postgres-pvc`) backed by the Minikube
default storage class, providing 1 GiB of persistent storage.

---

## Access

External access uses Minikube's LoadBalancer support via `minikube tunnel`.
The frontend service exposes ports 443 (HTTPS) and 80 (HTTP).

Prerequisites:

```bash
# Add to /etc/hosts:
10.107.80.138  greenops.local
10.107.80.138  accounts.greenops.local
10.107.80.138  monitor.greenops.local
```

> The LoadBalancer IP (shown above as `10.107.80.138`) is assigned dynamically.
> After running `minikube tunnel`, check the IP with:
> `kubectl get svc frontend -n greenops`

---

# 11. High Availability

The platform ensures resilience through:

* Multiple replicas (baseline: 2 replicas for critical services)
* Kubernetes self-healing
* Readiness probes
* Liveness probes
* Automatic restart mechanisms
* Horizontal Pod Autoscaler for dynamic scaling

Critical services (frontend, alerts-service, user-service) run with a minimum of 2 replicas to ensure high availability.

Example:

```yaml
replicas: 2
livenessProbe:
  httpGet:
    path: /health
    port: 3000
```

---

# 12. Horizontal Scaling

## Horizontal Pod Autoscaler (HPA)

Horizontal Pod Autoscaler automatically scales application pods based on CPU and memory utilization, ensuring optimal resource usage and performance.

### Configuration

HPA is configured for all critical services with the following parameters:

| Service          | Min Replicas | Max Replicas | CPU Threshold | Memory Threshold |
| ---------------- | ------------ | ------------ | ------------- | ----------------- |
| alerts-service   | 2            | 5            | 70%           | 80%               |
| user-service     | 2            | 5            | 70%           | 80%               |
| frontend         | 2            | 5            | 70%           | 80%               |

### HPA Manifests

HPA configurations are defined in:

```text
infrastructure/k8s/
├── 11-hpa-alerts.yml
├── 12-hpa-user.yml
└── 13-hpa-frontend.yml
```

Example HPA configuration:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: alerts-service-hpa
  namespace: greenops
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: alerts-service
  minReplicas: 2
  maxReplicas: 5
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Resource Requirements

All deployments include resource requests and limits to ensure proper scheduling and HPA functionality:

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### Prerequisites

HPA requires the Metrics Server to be installed in the cluster:

```bash
# Enable metrics-server addon in Minikube
minikube addons enable metrics-server
```

### Verification

Check HPA status:

```bash
# List all HPAs
kubectl get hpa -n greenops

# Detailed HPA information
kubectl describe hpa alerts-service-hpa -n greenops

# Watch HPA scaling in real-time
kubectl get hpa -n greenops -w
```

### Scaling Behavior

* **Scale Up**: Automatically triggered when CPU utilization exceeds 70% for sustained periods
* **Scale Down**: Gradual scale-down occurs when resource usage drops below threshold
* **Cooldown**: Default stabilization window prevents rapid scaling fluctuations
* **Minimum Replicas**: Always maintains at least 2 replicas for high availability

---

# 13. CI/CD Pipeline

GitHub Actions automates:

1. Code validation
2. Application build
3. Docker image build
4. Docker image push
5. Deployment validation

Pipeline:

```text
Git Push
    │
    ▼
GitHub Actions
    │
    ▼
Tests
    │
    ▼
Docker Build
    │
    ▼
Image Publish
```

---

# 14. Deployment Procedure

## Docker

```bash
# 1. Generate TLS certificates (one time only)
mkdir -p infrastructure/docker/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infrastructure/docker/certs/nginx.key \
  -out    infrastructure/docker/certs/nginx.crt \
  -subj  "/CN=greenops.local" \
  -addext "subjectAltName=DNS:greenops.local,DNS:accounts.greenops.local,DNS:monitor.greenops.local"

# 2. Start all services
docker compose -f infrastructure/docker/compose.yml up -d --build
```

## Minikube (Kubernetes)

### Prerequisites

- Minikube v1.38+
- Docker Engine
- `openssl`

### Deploy

```bash
# One-command deployment
bash infrastructure/k8s/deploy.sh
```

The script:
1. Generates self-signed TLS certificates
2. Starts Minikube if not running (Docker driver, 2 CPU, 4 GB RAM)
3. Creates the `greenops` namespace
4. Creates ConfigMaps from `infrastructure/k8s/` config files
5. Creates a TLS Secret with the generated certificates
6. Applies all Kubernetes manifests
7. Applies Horizontal Pod Autoscaler configurations
8. Waits for all pods to reach `Ready` state

### Enable Metrics Server

HPA requires the Metrics Server to be running. Enable it after deployment:

```bash
# Enable metrics-server addon (Minikube)
minikube addons enable metrics-server
```

### Post-deployment

```bash
# 1. Start the LoadBalancer tunnel (keep this terminal open)
minikube tunnel

# 2. In another terminal, get the LoadBalancer IP
kubectl get svc frontend -n greenops

# 3. Update /etc/hosts with the LoadBalancer IP
#    10.107.80.138  greenops.local
#    10.107.80.138  accounts.greenops.local
#    10.107.80.138  monitor.greenops.local
```

### Verify

```bash
# Check pods
kubectl get pods -n greenops

# Check services
kubectl get svc -n greenops

# Check Horizontal Pod Autoscalers
kubectl get hpa -n greenops

# Test application
curl -sk https://greenops.local/
```

### Useful Commands

```bash
# Rebuild config from source files
kubectl create configmap nginx-config -n greenops --from-file=default.conf=infrastructure/k8s/nginx.conf --dry-run=client -o yaml | kubectl apply -f -

# Restart a specific service
kubectl rollout restart deployment/<name> -n greenops

# Follow logs
kubectl logs -n greenops -l app=<service> --tail=50 -f

# Port-forward for debugging
kubectl port-forward -n greenops service/frontend 8443:443

# Reload Prometheus config without restarting
kubectl exec -n greenops deployment/prometheus -- kill -HUP 1

# Check HPA status and metrics
kubectl get hpa -n greenops
kubectl describe hpa alerts-service-hpa -n greenops

# Watch HPA scaling
kubectl get hpa -n greenops -w

# Delete everything
kubectl delete namespace greenops --force --grace-period=0

# Stop Minikube
minikube stop
```

### Docker: Reload Config After Changes

When updating mounted config files (nginx.conf, prometheus.yml, dashboard JSON), recreate the affected containers:

```bash
# Full refresh (keep volumes)
docker compose -f infrastructure/docker/compose.yml down && docker compose up -d --build

# Or reload Prometheus config on-the-fly
docker compose -f infrastructure/docker/compose.yml exec prometheus kill -HUP 1
```

---

# 15. Conclusion

GreenOps Platform demonstrates the implementation of a complete cloud-native infrastructure using Docker and Kubernetes.

The project applies modern DevOps principles including containerization, orchestration, observability, scalability, security, and automation while maintaining a modular microservices architecture suitable for future evolution.

