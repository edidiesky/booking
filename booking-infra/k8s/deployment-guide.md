# Deployment guide

Use this flow from the repo root.

## 1. Prepare the cluster access
Make sure your kubeconfig points at the target cluster:

```bash
kubectl config current-context
kubectl get nodes
```

## 2. Prepare secrets
Edit the secret file so it has the values you want to use:

```bash
k8s/secret-shared.yaml
```

For local/dev testing, mock values are fine. For real deployment, replace them with real values.

## 3. Apply everything with Kustomize
From the repo root, run:

```bash
kubectl apply -k ./k8s
```

This applies the full stack defined in the kustomization file:
- namespace and shared config
- data tier
- app and workers
- monitoring

## 4. Verify the rollout
Check that resources are created and pods come up:

```bash
kubectl get pods -n booking-platform
kubectl get svc -n booking-platform
kubectl get pvc -n booking-platform
```

## 5. Check the app
For the booking app, confirm health and the NodePort:

```bash
kubectl get svc -n booking-platform booking
kubectl logs -n booking-platform deploy/booking
```

Then test the health endpoint from the node or local machine:

```bash
curl http://<node-ip>:30080/health
```

## 6. When CI updates image tags
When CI opens a PR that updates the image tags in kustomization.yaml:

1. Review and merge the PR.
2. Run the same apply command again:

```bash
kubectl apply -k ./k8s
```

## 7. If something fails
Use:

```bash
kubectl describe pod -n booking-platform <pod-name>
kubectl logs -n booking-platform <pod-name>
```

That is the basic deployment flow now that Kustomize is the entry point.
