#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="greenops"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Generating self-signed TLS certificates ==="
CERT_DIR=$(mktemp -d)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERT_DIR/nginx.key" \
  -out "$CERT_DIR/nginx.crt" \
  -subj "/CN=greenops.local/O=GreenOps" \
  -addext "subjectAltName=DNS:greenops.local,DNS:accounts.greenops.local,DNS:monitor.greenops.local" 2>/dev/null

echo "=== Checking Minikube status ==="
if ! minikube status --format='{{.Name}}' &>/dev/null; then
  echo "Starting Minikube..."
  minikube start --driver=docker --cpus=2 --memory=4096
else
  echo "Minikube is already running."
fi

eval "$(minikube docker-env 2>/dev/null || true)"

echo "=== Creating namespace ==="
kubectl apply -f "$SCRIPT_DIR/00-namespace.yml"

echo "=== Creating Grafana provisioning ConfigMaps ==="
kubectl create configmap grafana-datasource \
  --namespace="$NAMESPACE" \
  --from-file=datasource.yml="$SCRIPT_DIR/../grafana/provisioning/datasources/datasource.yml" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap grafana-dashboard-provider \
  --namespace="$NAMESPACE" \
  --from-file=dashboard-provider.yml="$SCRIPT_DIR/../grafana/provisioning/dashboards/dashboard-provider.yml" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap grafana-dashboard \
  --namespace="$NAMESPACE" \
  --from-file=greenops-overview.json="$SCRIPT_DIR/../grafana/dashboards/greenops-overview.json" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "=== Creating ConfigMaps from K8s-specific config files ==="
kubectl create configmap nginx-config \
  --namespace="$NAMESPACE" \
  --from-file=default.conf="$SCRIPT_DIR/nginx.conf" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap prometheus-config \
  --namespace="$NAMESPACE" \
  --from-file=prometheus.yml="$SCRIPT_DIR/prometheus.yml" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap keycloak-realm \
  --namespace="$NAMESPACE" \
  --from-file=realm.json="$SCRIPT_DIR/realm.json" \
  --dry-run=client -o yaml | kubectl apply -f -

THEME_DIR="$SCRIPT_DIR/../docker/theme/greenops"
echo "=== Creating Keycloak theme ConfigMap ==="
kubectl create configmap keycloak-theme \
  --namespace="$NAMESPACE" \
  --from-file="$THEME_DIR/login/theme.properties" \
  --from-file="$THEME_DIR/common/resources/css/main.css" \
  --from-file="$THEME_DIR/common/resources/css/overrides.css" \
  --from-file="$THEME_DIR/common/resources/js/runtime.js" \
  --from-file="$THEME_DIR/common/resources/js/main.js" \
  -o yaml --dry-run=client | kubectl apply --server-side --force-conflicts -f -

echo "=== Creating TLS secret ==="
kubectl create secret generic nginx-tls \
  --namespace="$NAMESPACE" \
  --from-file="$CERT_DIR/nginx.crt" \
  --from-file="$CERT_DIR/nginx.key" \
  --dry-run=client -o yaml | kubectl apply -f -

rm -rf "$CERT_DIR"

echo "=== Applying remaining manifests ==="
kubectl apply -f "$SCRIPT_DIR/01-secrets.yml"
kubectl apply -f "$SCRIPT_DIR/03-postgres.yml"
kubectl apply -f "$SCRIPT_DIR/04-keycloak.yml"
kubectl apply -f "$SCRIPT_DIR/05-prometheus.yml"
kubectl apply -f "$SCRIPT_DIR/06-grafana.yml"
kubectl apply -f "$SCRIPT_DIR/07-alerts-service.yml"
kubectl apply -f "$SCRIPT_DIR/08-user-service.yml"
kubectl apply -f "$SCRIPT_DIR/09-frontend.yml"

echo "=== Applying Horizontal Pod Autoscalers ==="
kubectl apply -f "$SCRIPT_DIR/11-hpa-alerts.yml"
kubectl apply -f "$SCRIPT_DIR/12-hpa-user.yml"
kubectl apply -f "$SCRIPT_DIR/13-hpa-frontend.yml"

echo "=== Waiting for pods to be ready (this may take a few minutes) ==="
kubectl wait --for=condition=Ready pods --all -n "$NAMESPACE" --timeout=300s || true

echo ""
echo "=== Deployment Status ==="
kubectl get pods -n "$NAMESPACE"
echo ""
echo "=== Services ==="
kubectl get svc -n "$NAMESPACE"

NODE_PORT=$(kubectl get svc frontend -n "$NAMESPACE" -o jsonpath='{.spec.ports[?(@.name=="https")].nodePort}')
MINIKUBE_IP=$(minikube ip)

echo ""
echo "========================================================"
echo "  GreenOps K8s deployment is ready!"
echo "========================================================"
echo ""
echo "Add these entries to your /etc/hosts:"
echo "  $MINIKUBE_IP  greenops.local"
echo "  $MINIKUBE_IP  accounts.greenops.local"
echo "  $MINIKUBE_IP  monitor.greenops.local"
echo ""
echo "Access the application at:"
echo "  Frontend + API:  https://greenops.local (NodePort: $NODE_PORT)"
echo "  Keycloak Admin:  https://accounts.greenops.local"
echo "  Grafana:         https://monitor.greenops.local"
echo ""
echo "Credentials:"
echo "  Keycloak admin: admin / admin"
echo "  Test user:      marco.kuidja / user1password"
echo "========================================================"
