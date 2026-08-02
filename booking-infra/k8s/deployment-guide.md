# Deployment Guide

## Prerequisites
- k3s cluster, `kubectl` configured
- Repo cloned locally

## First-time setup
```bash
kubectl config current-context && kubectl get nodes   # confirm right cluster
```
Fill in real values in `booking-infra/k8s/secret-shared.yaml` (placeholders are fine for local testing).

## Deploy
```bash
kubectl apply -k booking-infra/k8s
```
Applies everything: namespace, shared ConfigMap/Secret, databases, booking API, workers, monitoring.

## Verify
```bash
kubectl get pods,svc,pvc -n booking-platform
curl http://<node-ip>:30080/health   # expect {"status":"ok"}
```

## Deploying new image versions
1. CI opens a PR bumping tags in `booking-infra/k8s/kustomization.yaml` — review and merge it.
2. On the cluster machine:
```bash
git pull
kubectl apply -k booking-infra/k8s
```
No Deployment YAML changes — only image tags in the kustomization file.

## Troubleshooting
```bash
kubectl describe pod -n booking-platform <pod-name>       # why it won't start
kubectl logs -n booking-platform <pod-name>                # what it's printing
kubectl rollout restart deployment/<name> -n booking-platform
kubectl rollout status deployment/<name> -n booking-platform
```