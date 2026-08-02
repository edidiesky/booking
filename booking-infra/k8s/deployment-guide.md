# Deployment Guide

## 1. Get the repo
```bash
git clone https://github.com/SDE-W/Itachi.git
cd Itachi
```

## 2. Point `kubectl` at your cluster
This works on any Kubernetes cluster — we run k3s on a Raspberry Pi, but nothing
here depends on that specifically. If `kubectl` is already set up and pointed at
your cluster, confirm it's the right one:
```bash
kubectl config current-context && kubectl get nodes
```

## 3. One-time secrets setup
Two secrets have to be created by hand — they're never committed to the repo,
so a fresh clone won't have them yet.

**a) App secrets.** Fill in real values in `booking-infra/k8s/secret-shared.yaml`
(database password, JWT secret, API keys, etc — placeholders are fine for local testing).

**b) GHCR pull secret.** The container images are private, so the cluster needs a
credential to download them. Create it once and attach it to the namespace's
default ServiceAccount — every deployment then pulls images with it automatically,
no further setup needed later:
```bash
kubectl create secret docker-registry ghcr-pull-secret \
  --docker-server=ghcr.io \
  --docker-username=<your-github-username> \
  --docker-password=<a GitHub PAT with read:packages scope> \
  --docker-email=<any-email> \
  -n booking-platform

kubectl patch serviceaccount default -n booking-platform \
  -p '{"imagePullSecrets": [{"name": "ghcr-pull-secret"}]}'
```
If the token ever expires, image pulls will start failing with `ImagePullBackOff`.
To fix it, just get a new PAT and re-run the `kubectl create secret` command with
`--dry-run=client -o yaml | kubectl apply -f -` added on the end — that updates the
existing secret in place instead of erroring that it already exists.

## 4. Deploy
```bash
kubectl apply -k booking-infra/k8s
```
Applies everything: namespace, shared ConfigMap/Secret, databases, booking API, workers, monitoring.

## 5. Verify
```bash
kubectl get pods,svc,pvc -n booking-platform
curl http://<node-ip>:30080/health   # expect {"status":"ok"}
```

## 6. Deploying new image versions
1. CI opens a PR bumping tags in `booking-infra/k8s/kustomization.yaml` — review and merge it.
2. On the cluster machine:
```bash
git pull
kubectl apply -k booking-infra/k8s
```
No Deployment YAML changes — only image tags in the kustomization file.

## 7. Troubleshooting
```bash
kubectl describe pod -n booking-platform <pod-name>       # why it won't start
kubectl logs -n booking-platform <pod-name>                # what it's printing
kubectl rollout restart deployment/<name> -n booking-platform
kubectl rollout status deployment/<name> -n booking-platform
```