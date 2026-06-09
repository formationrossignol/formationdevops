---
title: "TP 15 : Kind (Kubernetes in Docker)"
description: Créer et gérer des clusters Kubernetes locaux avec Kind.
---

## Objectif

Créer et gérer des clusters Kubernetes locaux avec Kind (Kubernetes in Docker).

Ce TP permet de voir comment :

- créer un cluster Kind simple
- créer un cluster multi-nœuds avec un fichier de configuration
- lister et inspecter les clusters existants
- supprimer un cluster

Kind crée des clusters Kubernetes en utilisant des conteneurs Docker comme nœuds. C'est la solution recommandée pour tester Kubernetes en local avant les TPs suivants.

## Prérequis

- Docker installé et lancé
- Kind installé
- kubectl installé

```bash
kind version
docker version
kubectl version --client
```

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
