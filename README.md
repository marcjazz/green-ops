# GreenOps Platform

## Technical Documentation

### Authors

* Student 1
* Student 2
* Student 3

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

## Namespaces

```text
greenops-app
greenops-monitoring
```

---

## Deployments

| Deployment      | Replicas |
| --------------- | -------- |
| frontend        | 2        |
| gateway         | 2        |
| auth-service    | 2        |
| metrics-service | 2        |

---

## Services

```text
ClusterIP
```

for internal communication.

```text
Ingress
```

for external access.

---

## ConfigMaps

Used for:

* Application configuration
* Service URLs
* Environment settings

---

## Secrets

Used for:

* Database credentials
* JWT secrets
* Redis credentials

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
docker compose up -d
```

## Kubernetes

```bash
kubectl apply -f k8s/
```

Verify:

```bash
kubectl get pods
kubectl get services
kubectl get ingress
```

---

# 15. Conclusion

GreenOps Platform demonstrates the implementation of a complete cloud-native infrastructure using Docker and Kubernetes.

The project applies modern DevOps principles including containerization, orchestration, observability, scalability, security, and automation while maintaining a modular microservices architecture suitable for future evolution.

