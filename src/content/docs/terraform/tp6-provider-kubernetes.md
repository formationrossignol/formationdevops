---
title: "TP 6 : Provider Kubernetes de Terraform"
description: Déployer des ressources Kubernetes (namespace, secret, pod, deployment, service) avec Terraform.
---

## Préparer l'environnement Terraform

Créez un répertoire pour le projet :

```bash
mkdir terraform-kubernetes-tp
cd terraform-kubernetes-tp
```

Créez un fichier `main.tf` avec le provider Kubernetes :

```hcl
terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }

  required_version = ">= 1.5.0"
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}
```

## Créer un namespace

```hcl
resource "kubernetes_namespace" "demo" {
  metadata {
    name = "demo-namespace"
  }
}
```

Appliquez et vérifiez :

```bash
terraform init
terraform apply
kubectl get namespaces
```

## Créer un secret

```hcl
resource "kubernetes_secret" "demo-secret" {
  metadata {
    name      = "my-secret"
    namespace = kubernetes_namespace.demo.metadata[0].name
  }

  data = {
    username = base64encode("admin")
    password = base64encode("P@ssw0rd")
  }

  type = "Opaque"
}
```

Appliquez et vérifiez :

```bash
terraform apply
kubectl get secret -n demo-namespace
kubectl get secret my-secret -n demo-namespace -o yaml
```

## Déployer un Pod

```hcl
resource "kubernetes_pod" "demo-pod" {
  metadata {
    name      = "nginx-pod"
    namespace = kubernetes_namespace.demo.metadata[0].name

    labels = {
      app = "nginx"
    }
  }

  spec {
    container {
      name  = "nginx"
      image = "nginx:1.21"

      port {
        container_port = 80
      }
    }
  }
}
```

Appliquez et vérifiez :

```bash
terraform apply
kubectl get pods -n demo-namespace
```

## Créer un Deployment

```hcl
resource "kubernetes_deployment" "demo-deployment" {
  metadata {
    name      = "nginx-deployment"
    namespace = kubernetes_namespace.demo.metadata[0].name
  }

  spec {
    replicas = 3

    selector {
      match_labels = {
        app = "nginx"
      }
    }

    template {
      metadata {
        labels = {
          app = "nginx"
        }
      }

      spec {
        container {
          name  = "nginx"
          image = "nginx:1.21"

          port {
            container_port = 80
          }
        }
      }
    }
  }
}
```

Appliquez et vérifiez :

```bash
terraform apply
kubectl get deployments -n demo-namespace
kubectl get pods -n demo-namespace
```

## Exposer le déploiement avec un service

```hcl
resource "kubernetes_service" "demo-service" {
  metadata {
    name      = "nginx-service"
    namespace = kubernetes_namespace.demo.metadata[0].name
  }

  spec {
    selector = {
      app = "nginx"
    }

    type = "NodePort"

    port {
      port        = 80
      target_port = 80
    }
  }
}
```

Appliquez et accédez au service :

```bash
terraform apply
kubectl get services -n demo-namespace
kubectl port-forward service/nginx-service 8080:80 -n demo-namespace
curl http://localhost:8080
```

## Supprimer les ressources

```bash
terraform destroy
```
