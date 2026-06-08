---
title: "TP : Créer plusieurs conteneurs avec for_each"
description: Créer plusieurs conteneurs Docker à partir d'une map Terraform avec for_each.
---

## Objectif

Créer plusieurs conteneurs Docker à partir d'une map Terraform avec `for_each`.

Cette méthode est plus adaptée que `count` lorsque chaque ressource a une configuration différente, car Terraform identifie chaque ressource par une **clé nommée** et non par un index numérique. Ajouter ou supprimer un élément n'affecte pas les autres ressources.

## Arborescence

```
tp-terraform-for-each/
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
variable "containers" {
  description = "Liste des conteneurs à créer"
  type = map(object({
    image         = string
    external_port = number
  }))

  default = {
    nginx = {
      image         = "nginx:latest"
      external_port = 8080
    }

    apache = {
      image         = "httpd:latest"
      external_port = 8081
    }

    caddy = {
      image         = "caddy:latest"
      external_port = 8082
    }
  }
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

resource "docker_image" "images" {
  for_each = var.containers

  name = each.value.image
}

resource "docker_container" "web" {
  for_each = var.containers

  name  = each.key
  image = docker_image.images[each.key].image_id

  ports {
    internal = 80
    external = each.value.external_port
  }
}
```

> Avec `for_each`, Terraform expose deux mots-clés dans le bloc de ressource :
> - `each.key` : la clé de la map, ici `"nginx"`, `"apache"` ou `"caddy"` -- utilisée comme nom du conteneur.
> - `each.value` : l'objet associé à cette clé, ici `{ image = "...", external_port = ... }`.
>
> Terraform crée ainsi `docker_container.web["nginx"]`, `docker_container.web["apache"]` et `docker_container.web["caddy"]` -- des identifiants stables qui ne changent pas si l'on ajoute ou retire un autre élément de la map.

## Fichier `outputs.tf`

```hcl
output "container_urls" {
  description = "URLs des conteneurs créés"
  value = {
    for name, container in var.containers :
    name => "http://localhost:${container.external_port}"
  }
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

Ouvrir :

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

## Modification : ajouter un quatrième conteneur

Ajouter l'entrée `traefik` dans le bloc `default` de la variable `containers` dans `variables.tf` :

```hcl
default = {
  nginx = {
    image         = "nginx:latest"
    external_port = 8080
  }

  apache = {
    image         = "httpd:latest"
    external_port = 8081
  }

  caddy = {
    image         = "caddy:latest"
    external_port = 8082
  }

  traefik = {
    image         = "traefik:v3.0"
    external_port = 8083
  }
}
```

Puis exécuter :

```bash
terraform plan
terraform apply
```

Terraform doit proposer uniquement la création de `docker_container.web["traefik"]` et `docker_image.images["traefik"]`, sans toucher aux trois conteneurs existants.

> C'est l'avantage de `for_each` sur `count` : ajouter ou supprimer un élément nommé n'affecte pas les ressources dont la clé n'a pas changé.

## Nettoyage

```bash
terraform destroy
```
