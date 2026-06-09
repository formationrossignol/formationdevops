---
title: "TP 19 : Provider Helm de Terraform"
description: Gérer des releases Helm avec le provider Terraform.
---

## Objectif

Gérer des releases Helm avec le provider Terraform `hashicorp/helm`.

Ce TP permet de voir comment :

- configurer les providers Helm et Kubernetes dans Terraform
- déployer un chart Helm via une ressource `helm_release`
- modifier les paramètres d'une release avec `set`
- utiliser un fichier `values.yaml` depuis Terraform
- détruire une release via `terraform destroy`

## Prérequis

- Terraform installé
- Helm installé
- Un cluster Kubernetes fonctionnel (Kind — voir TP 14)
- kubectl installé et configuré

```bash
terraform version
helm version
kubectl cluster-info
```

## Préparer l'environnement

Créez un répertoire pour votre projet Terraform :

```bash
mkdir terraform-helm-tp && cd terraform-helm-tp
```

## Configuration de base

Initialisez un fichier `main.tf` avec les providers Helm et Kubernetes :

```hcl
terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }

    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.8"
    }
  }

  required_version = ">= 1.5.0"
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

provider "helm" {
  kubernetes {
    config_path = "~/.kube/config"
  }
}
```

## Ajouter un chart Helm

Ajoutez une ressource pour déployer un chart Helm (Nginx depuis Bitnami) :

> **Note** : Quand `repository` est une URL, `chart` doit être le nom court (`nginx`) et non le chemin qualifié (`bitnami/nginx`). Le champ `wait` est un booléen, pas une chaîne.

```hcl
resource "helm_release" "nginx" {
  name       = "nginx-release"
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "nginx"
  version    = "18.3.5"
  wait       = false

  set {
    name  = "replicaCount"
    value = "2"
  }

  set {
    name  = "service.type"
    value = "LoadBalancer"
  }
}
```

## Initialiser et appliquer Terraform

```bash
terraform init
terraform plan
terraform apply
```

Vérifiez les ressources Kubernetes créées :

```bash
kubectl get all
```

## Modifier les paramètres

Ajoutez une annotation à la ressource `helm_release` :

```hcl
set {
    name  = "service.annotations.prometheus\\.io/scrape"
    value = "\"true\""
}
```

Appliquez et vérifiez :

```bash
terraform apply
kubectl describe service nginx-release
```

## Supprimer la release

```bash
terraform destroy
kubectl get all
```

## Utilisation d'un fichier `values.yaml`

Créez un fichier `values.yaml` :

```yaml
replicaCount: 3

service:
  type: NodePort
```

Modifiez la ressource `helm_release` :

```hcl
resource "helm_release" "nginx" {
  name       = "nginx-release"
  chart      = "nginx"
  namespace  = "default"
  repository = "https://charts.bitnami.com/bitnami"
  version    = "18.3.5"
  values     = [file("values.yaml")]
}
```

Appliquez et vérifiez :

```bash
terraform apply
kubectl get pods
kubectl describe service nginx-release
```

## Export des logs

```bash
terraform output
```
