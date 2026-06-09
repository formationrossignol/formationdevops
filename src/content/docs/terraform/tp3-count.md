---
title: "TP 3 : Plusieurs conteneurs avec count"
description: Créer plusieurs conteneurs Docker identiques avec Terraform en utilisant count.
---

## Objectif

Créer plusieurs conteneurs Docker identiques avec Terraform en utilisant `count`.

## Prérequis

- Terraform installé
- Docker installé et lancé

## Arborescence

```
tp-terraform-count/
├── main.tf
├── variables.tf
├── outputs.tf
└── .gitignore
```

## Fichier `.gitignore`

```
.terraform/
*.tfstate
*.tfstate.*
*.tfvars
.terraform.lock.hcl
```

## Fichier `variables.tf`

```hcl
variable "container_count" {
  description = "Nombre de conteneurs à créer"
  type        = number
  default     = 3
}

variable "image_name" {
  description = "Image Docker utilisée"
  type        = string
  default     = "nginx:latest"
}

variable "base_external_port" {
  description = "Premier port exposé sur la machine locale"
  type        = number
  default     = 8080
}
```

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
  count = var.container_count

  name  = "web-${count.index + 1}"
  image = docker_image.nginx.image_id

  ports {
    internal = 80
    external = var.base_external_port + count.index
  }
}
```

> `count.index` démarre à `0`. Avec `count = 3`, Terraform crée `web[0]`, `web[1]` et `web[2]`, exposés respectivement sur les ports `8080`, `8081` et `8082`.

## Fichier `outputs.tf`

```hcl
output "container_urls" {
  description = "URLs des conteneurs créés"
  value = [
    for i in range(var.container_count) :
    "http://localhost:${var.base_external_port + i}"
  ]
}
```

## Commandes

```bash
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
```

## Vérification

Ouvrir dans le navigateur :

```
http://localhost:8080
http://localhost:8081
http://localhost:8082
```

Ou tester avec curl :

```bash
curl http://localhost:8080
curl http://localhost:8081
curl http://localhost:8082
```

## Modification : augmenter le nombre de conteneurs

Passer à 5 conteneurs sans modifier `variables.tf`, en utilisant l'option `-var` :

```bash
terraform plan -var="container_count=5"
terraform apply -var="container_count=5"
```

Terraform doit proposer uniquement la création de deux conteneurs supplémentaires (`web[3]` et `web[4]`).

> **Bonne pratique** : ne pas modifier la valeur `default` dans `variables.tf` pour ajuster un paramètre d'exécution. Utiliser `-var` ou un fichier `.tfvars`.

## Limite de `count` : le problème de la renumérotation

`count` identifie chaque ressource par son **index numérique**. Si l'on supprime un élément au milieu de la liste, Terraform renumérote tous les suivants et les recrée inutilement.

Exemple : avec 3 conteneurs (`web[0]`, `web[1]`, `web[2]`), si l'on passe à 2 en retirant le premier, Terraform détruit `web[2]` et modifie `web[1]` pour qu'il prenne les attributs de l'ancien `web[0]`.

C'est pourquoi `for_each` est préférable dès que les ressources ont des configurations distinctes.

## Nettoyage

```bash
terraform destroy
```

Si la modification avec 5 conteneurs a été appliquée, s'assurer de détruire avec la même valeur :

```bash
terraform destroy -var="container_count=5"
```
