---
marp: true
theme: uncover
class: invert
paginate: true
---

# <!--fit--> Plateforme GreenOps
## Présentation de l'Architecture

---

# Architecture en un Coup d'Œil

| Couche | Technologie |
|--------|-------------|
| **Frontend** | SPA React (Vite + TypeScript) servie par Nginx |
| **Passerelle API** | Proxy inverse Nginx (point d'entrée unique) |
| **Identité** | Keycloak (OIDC / JWT) |
| **Backend** | alerts-service, user-service (Node.js + Express) |
| **Base de données** | PostgreSQL (multi-schéma) |
| **Surveillance** | Prometheus + Grafana |
| **Orchestration** | Docker Compose / Kubernetes (Minikube) |

---

![width:900](arch-diagram-fr.svg)

---

# Flux des Requêtes

```
                      ┌─────────────────┐
                      │   Keycloak       │
                      │  accounts.*      │
                      └────────┬────────┘
                               │ OIDC
┌──────────┐  HTTPS   ┌───────▼────────┐
│          │──────────►│    Nginx       │
│ Browser  │◄──────────│  (proxy        │
│ (React)  │          │   inverse + TLS)│
└──────────┘          └───┬───┬───┬────┘
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
          │  (multi-schéma)│
          └────────────────┘
```

---

# Routage Nginx

| Nom du serveur | Rôle |
|---------------|------|
| `greenops.local` | Frontend + API |
| `accounts.greenops.local` | Keycloak |
| `monitor.greenops.local` | Grafana |
| `localhost:8081` | stub_status (interne, nginx-exporter) |

**Routes API :**
- `/api/alerts/*` → `alerts-service:3001`
- `/api/user/*` → `user-service:3003/profile/*`
- `/api/prometheus/*` → `prometheus:9090`

---

# Keycloak — Fournisseur d'Identité

- Fournisseur OpenID Connect (OIDC) sur `https://accounts.greenops.local`
- Realm `greenops` pré-configuré (importé depuis `realm.json`)
- Clients : `greenops-frontend` (public), `greenops-grafana` (confidentiel)
- Métriques activées (`KC_METRICS_ENABLED=true`) pour Prometheus
- Clés de signature JWT récupérées via JWKS URI
- CORS configuré pour `https://greenops.local`

---

# Frontend — SPA React

| Aspect | Détail |
|--------|--------|
| **Construction** | Vite + React 19 (TypeScript) |
| **Docker** | Multi-étapes, servi par Nginx |
| **Auth** | `react-oidc-context` pour Keycloak |
| **Appels API** | Axios avec interceptor JWT |

**Pages :**
- **Tableau de bord** — nombre d'alertes, thème, durées de scraping, alertes récentes
- **Services** — état en direct (actif/inactif) via la métrique Prometheus `up`

---

# alerts-service

- **Langage :** Node.js + Express 5 (TypeScript) — Port `3001`
- **Points d'accès :** `GET/POST /alerts`, `PATCH /:id/read`, `/health`, `/metrics`
- **Moniteur en arrière-plan** (`src/monitor.ts`) :
  1. Interroge Prometheus toutes les 30s pour les règles d'alerte
  2. Crée un enregistrement `Alert` dans PostgreSQL si seuil dépassé
  3. Marque les alertes en attente comme lues quand la métrique se normalise

**Règles d'alerte :** détection de service hors ligne, avertissements de durée de scraping élevée

---

# user-service

- **Langage :** Node.js + Express 5 (TypeScript) — Port `3003`
- **Points d'accès :** `GET/PATCH /profile`, `/health`, `/metrics`
- Profils indexés par la revendication JWT `sub` (ID utilisateur Keycloak)
- Recherche de secours par email si `sub` introuvable

**Champs du profil :** thème, notifications, disposition du tableau de bord

---

# PostgreSQL — Conception Multi-Schéma

```sql
-- Schéma : users (user-service)
CREATE TABLE users."UserProfile" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "keycloakId" TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    theme TEXT NOT NULL DEFAULT 'light',
    notifications BOOLEAN NOT NULL DEFAULT true,
    "dashboardLayout" JSONB,
    ...
);

-- Schéma : alerts (alerts-service)
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

# Prometheus — Surveillance

- **Image :** `prom/prometheus`, Port : `9090` (interne)
- **Intervalle de scraping :** toutes les 15s

| Job | Cible |
|-----|-------|
| `prometheus` | `localhost:9090` |
| `alerts-service` | `alerts-service:3001` |
| `user-service` | `user-service:3003` |
| `postgres-exporter` | `postgres-exporter:9187` |
| `keycloak` | `keycloak:8080/metrics` |
| `nginx-exporter` | `nginx-exporter:9113` |

Le frontend interroge Prometheus via le proxy Nginx pour `scrape_duration_seconds` et `up`.

---

# Grafana — Tableaux de Bord

- **Image :** `grafana/grafana`, Port : `3000` (interne)
- **Auth :** OIDC via Keycloak (client `greenops-grafana`)
- **Accès :** `https://monitor.greenops.local`

Disponibles dans `docs/grafana-dashboards/` — JSON prêts à importer.

---

# nginx-exporter

- **Image :** `nginx/nginx-prometheus-exporter:latest`
- **Port :** `9113` (interne)
- **Scrape :** stub_status Nginx sur le port `8081`

Expose les métriques de connexion Nginx à Prometheus.
- Docker : service séparé dans compose.yml
- Kubernetes : conteneur sidecar dans le pod frontend

---

# Infrastructure — Docker

```
# Générer les certificats TLS (une seule fois)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infrastructure/docker/certs/nginx.key \
  -out    infrastructure/docker/certs/nginx.crt \
  -subj  "/CN=greenops.local" \
  -addext "subjectAltName=DNS:greenops.local,..."

# Démarrer tous les services
docker compose -f infrastructure/docker/compose.yml up -d --build

# Entrées /etc/hosts
127.0.0.1  greenops.local
127.0.0.1  accounts.greenops.local
127.0.0.1  monitor.greenops.local
```

---

# Infrastructure — Kubernetes (Minikube)

```
# Déployer tous les services
bash infrastructure/k8s/deploy.sh

# Démarrer le tunnel LoadBalancer
minikube tunnel

# Mettre à jour /etc/hosts avec l'IP EXTERNAL-IP de :
kubectl get svc frontend -n greenops
```

**Déploiements :** postgres, keycloak, prometheus, grafana, alerts-service, user-service, frontend + postgres-exporter + nginx-exporter

---

# Architecture Kubernetes

```
                                    ┌──────────────┐
                                    │  Keycloak    │
                                    │  ClusterIP   │
                                    └──────┬───────┘
                                           │
┌──────────┐  HTTPS   ┌────────────────────▼────────┐
│          │──────────►│  frontend (LoadBalancer)    │
│ Browser  │◄──────────│  ├─ nginx (proxy inverse)  │
│ (React)  │           │  └─ SPA (fichiers statiques)│
└──────────┘           └───┬───┬───┬────┬────┬──────┘
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

# Pipelines CI/CD

**CI** (push/PR vers `main`/`master`):
1. `pnpm install --frozen-lockfile`
2. `pnpm biome ci .` — lint & format
3. Construction du package `shared`
4. Vérification de types séquentielle de chaque service

**Publication** (push vers `main` ou tag `v*`):
- Construit et publie 3 images vers GHCR :
  - `frontend`, `alerts-service`, `user-service`
- Tags : `latest`, `sha-<short>`, semver

---

# Docker vs Kubernetes

| Aspect | Docker | K8s |
|--------|--------|-----|
| Fichiers de config | `infrastructure/docker/` | `infrastructure/k8s/` |
| Certificats TLS | Persistants dans `certs/` | Générés au déploiement |
| Point d'entrée | `compose.yml` | `deploy.sh` |
| Frontend | Mapping de ports | LoadBalancer + tunnel |
| Données PostgreSQL | Volume nommé `postgres_data` | PVC `postgres-pvc` (1 Go) |

---

<!-- _class: invert -->
# <!--fit--> Merci

**GreenOps** — Plateforme de Surveillance Énergétique Cloud-Native

Marco KUIDJA · Moussa TOURE · Wilfried MAILLET
