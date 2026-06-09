---
title: "TP 18 : Utilisation de Helm"
description: Déployer, personnaliser et gérer des applications Kubernetes avec Helm.
---

## Objectif

Déployer, personnaliser et gérer des applications Kubernetes avec Helm.

Ce TP permet de voir comment :

- configurer Helm avec un cluster Kubernetes
- installer un chart Helm depuis un dépôt
- personnaliser une installation avec un fichier `values.yaml`
- mettre à jour une release
- effectuer un rollback vers une version précédente
- supprimer une release

## Prérequis

- **Cluster Kubernetes fonctionnel** : Utilisez Minikube, Kind, ou un cluster réel.
- **Helm installé** : Installation de Helm.
- **kubectl installé** : Installation de kubectl.

## Configuration initiale

Vérifiez l'accès à votre cluster Kubernetes avec `kubectl`

```bash
kubectl cluster-info
```

Installez Helm et vérifiez la version

```bash
helm version
```

Ajoutez un dépôt Helm, par exemple Bitnami

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

## Installation d'un chart Helm

Installez l'application Nginx à partir du dépôt Bitnami

```bash
helm install my-nginx bitnami/nginx --namespace nginx --create-namespace
```

Vérifiez que l'application est déployée

```bash
kubectl get pods --namespace nginx
kubectl get services --namespace nginx
```

Listez les releases Helm installées

```bash
helm list
```

## Personnalisation d'une installation

Consultez les valeurs par défaut du chart Nginx

```bash
helm show values bitnami/nginx > nginx-default-values.yaml
```

Créez un fichier `custom-values.yaml`

```yaml
replicaCount: 2

service:
  type: LoadBalancer
```

Mettez à jour votre release avec ces valeurs

```bash
helm upgrade my-nginx bitnami/nginx -f custom-values.yaml -n <nom-du-namespace>
```

Vérifiez que les modifications ont été appliquées

```bash
kubectl get pods --namespace nginx
kubectl get services --namespace nginx
```

## Rollback d'une version

Revenez à une version précédente

```bash
helm rollback my-nginx 1
```

Vérifiez l'état des pods après le rollback

```bash
kubectl get pods --namespace nginx
```

## Supprimer une release

```bash
helm uninstall my-nginx
```

Vérifiez que les ressources associées ont été supprimées

```bash
kubectl get all --namespace nginx
```
