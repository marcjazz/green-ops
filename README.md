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
                    │ API Gateway │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼

 ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
 │ Auth Service│   │ Metrics API │   │ Alert API   │
 └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
        │                 │                 │
        └─────────┬───────┴─────────┬───────┘
                  │                 │
                  ▼                 ▼

          ┌─────────────┐   ┌─────────────┐
          │ PostgreSQL  │   │ Redis Cache │
          └─────────────┘   └─────────────┘

                  │
                  ▼

       ┌──────────────────────┐
       │ Prometheus + Grafana │
       └──────────────────────┘
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

| Component       | Technology        |
| --------------- | ----------------- |
| API Gateway     | Node.js + Express |
| Auth Service    | Node.js + Express |
| Metrics Service | Node.js + Express |

## Data Layer

| Component | Technology |
| --------- | ---------- |
| Database  | PostgreSQL |
| Cache     | Redis      |

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

# 5. Microservices Description

## API Gateway

Responsibilities:

* Single entry point
* Request routing
* Authentication validation
* Service discovery

### Endpoints

```http
POST /api/login
GET  /api/metrics
GET  /api/health
```

---

## Authentication Service

Responsibilities:

* User management
* JWT generation
* JWT validation

### Endpoints

```http
POST /login
POST /register
GET  /health
```

---

## Metrics Service

Responsibilities:

* Energy metrics retrieval
* Dashboard data generation

### Endpoints

```http
GET /metrics
GET /health
```

---

# 6. Database Design

## Users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255),
    password_hash TEXT,
    role VARCHAR(50)
);
```

## Metrics

```sql
CREATE TABLE metrics (
    id UUID PRIMARY KEY,
    metric_name VARCHAR(100),
    metric_value NUMERIC,
    created_at TIMESTAMP
);
```

## Alerts

```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY,
    severity VARCHAR(50),
    message TEXT,
    created_at TIMESTAMP
);
```

---

# 7. Docker Infrastructure

## Services

| Service       | Container       |
| ------------- | --------------- |
| Frontend      | frontend        |
| Gateway       | gateway         |
| Auth          | auth-service    |
| Metrics       | metrics-service |
| PostgreSQL    | postgres        |
| Redis         | redis           |
| Prometheus    | prometheus      |
| Grafana       | grafana         |
| Reverse Proxy | nginx           |

---

## Docker Networks

### Public Network

Used for:

* Frontend
* Nginx

### Private Network

Used for:

* Internal APIs
* PostgreSQL
* Redis

---

## Persistent Volumes

```text
postgres_data
grafana_data
prometheus_data
```

---

# 8. Monitoring and Observability

## Prometheus

Prometheus collects:

* CPU usage
* Memory usage
* HTTP requests
* Service health metrics

### Scraped Targets

```text
gateway:3000
auth-service:3001
metrics-service:3002
```

---

## Grafana

Dashboards include:

* Infrastructure Overview
* Application Metrics
* Resource Consumption
* Request Rate
* Error Rate

---

# 9. Security

## Authentication

JWT-based authentication.

### Flow

```text
User
  │
  ▼
Login
  │
  ▼
JWT Token
  │
  ▼
Protected API Access
```

---

## Secrets Management

Sensitive values are stored using:

* Environment variables (Docker)
* Kubernetes Secrets

Examples:

```text
POSTGRES_PASSWORD
JWT_SECRET
REDIS_PASSWORD
```

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

| Deployment         | Image                                         | Port | Probes |
| ------------------ | --------------------------------------------- | ---- | ------ |
| frontend           | ghcr.io/marcjazz/green-ops/frontend:latest    | 443  | —      |
| alerts-service     | ghcr.io/marcjazz/green-ops/alerts-service:latest | 3001 | /health |
| user-service       | ghcr.io/marcjazz/green-ops/user-service:latest   | 3003 | /health |
| postgres           | postgres:16-alpine                            | 5432 | pg_isready |
| postgres-exporter  | prometheuscommunity/postgres-exporter         | 9187 | —      |
| keycloak           | quay.io/keycloak/keycloak:24.0                | 8080 | —      |
| prometheus         | prom/prometheus                               | 9090 | —      |
| grafana            | grafana/grafana                               | 3000 | —      |

---

## Services

| Service            | Type         | Port(s)            | Purpose |
| ------------------ | ------------ | ------------------ | ------- |
| frontend           | LoadBalancer | 443, 80            | External entry point (nginx) |
| alerts-service     | ClusterIP    | 3001               | Internal API |
| user-service       | ClusterIP    | 3003               | Internal API |
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

| ConfigMap          | Source File                        | Mounted In      |
| ------------------ | ---------------------------------- | --------------- |
| `nginx-config`     | `infrastructure/k8s/nginx.conf`    | frontend        |
| `prometheus-config` | `infrastructure/k8s/prometheus.yml` | prometheus      |
| `keycloak-realm`   | `infrastructure/k8s/realm.json`    | keycloak        |

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
| `greenops-secrets`  | postgres-user, postgres-password, postgres-db |
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

* Multiple replicas
* Kubernetes self-healing
* Readiness probes
* Liveness probes
* Automatic restart mechanisms

Example:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
```

---

# 12. Horizontal Scaling

Horizontal Pod Autoscaler is configured.

Example:

```yaml
minReplicas: 2
maxReplicas: 5
targetCPUUtilizationPercentage: 70
```

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
7. Waits for all pods to reach `Ready` state

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
kubectl get pods -n greenops
kubectl get svc -n greenops
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

# Delete everything
kubectl delete namespace greenops --force --grace-period=0

# Stop Minikube
minikube stop
```

---

# 15. Conclusion

GreenOps Platform demonstrates the implementation of a complete cloud-native infrastructure using Docker and Kubernetes.

The project applies modern DevOps principles including containerization, orchestration, observability, scalability, security, and automation while maintaining a modular microservices architecture suitable for future evolution.

