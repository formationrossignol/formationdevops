---
title: "TP OpenTofu : déployer un conteneur Nginx en local"
description: Tester OpenTofu sur un cas simple d'Infrastructure as Code avec Docker.
---

## Objectif

Tester OpenTofu sur un cas simple d'Infrastructure as Code :

- initialiser un projet OpenTofu
- installer un provider
- créer un conteneur Docker
- modifier une ressource
- observer le plan d'exécution
- supprimer les ressources créées

OpenTofu utilise la commande `tofu`. Les commandes principales sont similaires à Terraform : `tofu init`, `tofu plan`, `tofu apply` et `tofu destroy`. OpenTofu vise une compatibilité avec les configurations Terraform existantes, même si une migration doit être vérifiée au cas par cas.

> **Note** : OpenTofu accepte le bloc `terraform {}` par compatibilité ascendante avec Terraform. Dans un projet OpenTofu natif, il est possible d'utiliser `tofu {}` à la place -- les deux sont équivalents.

## Prérequis

Installer :

- [OpenTofu](https://opentofu.org/docs/intro/install/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- un éditeur de code, par exemple VS Code

Vérifier les installations :

```bash
tofu version
docker version
```

## Arborescence du projet

```
tp-opentofu-docker/
├── main.tf
├── variables.tf
├── outputs.tf
└── .gitignore
```

## Fichier `.gitignore`

```
.terraform/
.opentofu/
.terraform.lock.hcl
*.tfstate
*.tfstate.*
*.tfvars
```

> OpenTofu utilise `.opentofu/` comme répertoire de travail interne selon les versions. Les deux entrées sont nécessaires pour couvrir tous les cas.

## Fichier `main.tf`

```hcl
terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

resource "docker_image" "nginx" {
  name = var.image_name
}

resource "docker_container" "web" {
  name  = var.container_name
  image = docker_image.nginx.image_id

  ports {
    internal = 80
    external = var.external_port
  }
}
```

> OpenTofu utilise des providers pour interagir avec des systèmes externes. Les providers doivent être déclarés dans la configuration pour qu'OpenTofu puisse les installer et les utiliser.

## Fichier `variables.tf`

```hcl
variable "image_name" {
  description = "Image Docker à utiliser"
  type        = string
  default     = "nginx:latest"
}

variable "container_name" {
  description = "Nom du conteneur Docker"
  type        = string
  default     = "tp-opentofu-nginx"
}

variable "external_port" {
  description = "Port exposé sur la machine locale"
  type        = number
  default     = 8080
}
```

## Fichier `outputs.tf`

```hcl
output "application_url" {
  description = "URL locale de l'application"
  value       = "http://localhost:${var.external_port}"
}

output "container_name" {
  description = "Nom du conteneur créé"
  value       = docker_container.web.name
}
```

## Étape 1 : initialiser le projet

Dans le dossier du TP :

```bash
tofu init
```

> `tofu init` initialise le dossier de travail et installe les plugins nécessaires aux providers déclarés.

## Étape 2 : formater et valider

```bash
tofu fmt
tofu validate
```

## Étape 3 : afficher le plan

```bash
tofu plan
```

> `tofu plan` affiche les actions qu'OpenTofu prévoit d'exécuter avant toute modification réelle de l'infrastructure.

## Étape 4 : créer le conteneur

```bash
tofu apply
```

Confirmer avec `yes`.

> `tofu apply` exécute les actions prévues dans le plan pour créer, modifier ou supprimer l'infrastructure.

Tester ensuite dans le navigateur : `http://localhost:8080`

Ou avec curl :

```bash
curl http://localhost:8080
```

## Étape 5 : vérifier avec Docker

```bash
docker ps
```

Le conteneur doit apparaître avec le nom `tp-opentofu-nginx`.

## Étape 6 : modifier une variable

En pratique, on ne modifie pas les valeurs `default` dans `variables.tf` pour changer un paramètre -- on utilise un fichier `.tfvars`. Créer un fichier `dev.tfvars` :

```hcl
container_name = "tp-opentofu-nginx"
external_port  = 8081
image_name     = "nginx:latest"
```

Puis exécuter :

```bash
tofu plan -var-file="dev.tfvars"
```

Observer les changements proposés -- OpenTofu doit indiquer que le conteneur sera recréé car le port change.

Appliquer :

```bash
tofu apply -var-file="dev.tfvars"
```

Tester ensuite : `http://localhost:8081`

> **Bonne pratique** : modifier les valeurs par défaut dans `variables.tf` est réservé aux changements de valeurs référence du projet. Pour les environnements (dev, staging, prod), utiliser toujours des fichiers `.tfvars` distincts.

## Étape 7 : observer le state

Lister les ressources suivies par OpenTofu :

```bash
tofu state list
```

Afficher le contenu détaillé d'une ressource :

```bash
tofu state show docker_container.web
```

> Le fichier de state permet à OpenTofu de suivre les ressources qu'il gère. Il ne doit pas être supprimé ou modifié manuellement sans raison précise.

## Étape 8 : provoquer une dérive

Supprimer manuellement le conteneur hors OpenTofu :

```bash
docker rm -f tp-opentofu-nginx
```

> **Attention** : `docker stop` ne suffit pas -- OpenTofu ne gère pas l'état running/stopped d'un conteneur, uniquement son existence. Pour provoquer une vraie dérive détectable, il faut supprimer le conteneur avec `docker rm -f`.

Puis relancer :

```bash
tofu plan
```

OpenTofu doit détecter que le conteneur n'existe plus et proposer de le recréer (`+ create`).

Rétablir l'état attendu :

```bash
tofu apply
```

## Étape 9 : supprimer les ressources

```bash
tofu destroy
```

Confirmer avec `yes`.

> `tofu destroy` supprime les objets gérés par la configuration OpenTofu courante.

## Extension possible

Ajouter un second conteneur avec une autre image, par exemple `httpd:latest`, exposé sur le port `8082` :

```hcl
resource "docker_image" "httpd" {
  name = "httpd:latest"
}

resource "docker_container" "apache" {
  name  = "tp-opentofu-apache"
  image = docker_image.httpd.image_id

  ports {
    internal = 80
    external = 8082
  }
}
```

Puis exécuter :

```bash
tofu plan
tofu apply
```
