---
title: "TP 1 : Utilisation de Kind (Kubernetes in Docker)"
description: Créer et gérer des clusters Kubernetes locaux avec Kind.
---

## Créer un cluster

```bash
kind create cluster --name <nom_du_cluster>
```

### Créer un cluster avec plusieurs noeuds

```bash
kind create cluster --config multinodes-config.yaml
```

Contenu du fichier `multinodes-config.yaml`

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
  - role: worker
  - role: worker
```

## Lister les clusters

```bash
kind get clusters
```

## Récupérer des informations sur un cluster

```bash
kubectl cluster-info --context kind-<nom_du_cluster>
```

## Lister les noeuds

```bash
kubectl get nodes
```

## Supprimer un cluster

```bash
kind delete cluster --name <nom_du_cluster>
```
