---
title: "TP 7 : Workspaces multi-environnements"
description: Utiliser les workspaces Terraform pour gérer dev, test et prod à partir du même code.
---

## Objectif

Utiliser les workspaces Terraform pour gérer plusieurs environnements à partir du même code :

- `dev`
- `test`
- `prod`

Chaque workspace déploie un conteneur Docker différent, avec un nom et un port adaptés à l'environnement.

## Prérequis

- Terraform installé
- Docker installé et lancé
- Un terminal
- Un éditeur de code

Vérifier :

```bash
terraform version
docker version
```

## Arborescence

```
tp-terraform-workspaces/
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
.terraform.lock.hcl
*.tfvars
```

## Fichier `variables.tf`

```hcl
variable "image_name" {
  description = "Image Docker utilisée"
  type        = string
  default     = "nginx:latest"
}

variable "environment_ports" {
  description = "Ports utilisés selon le workspace"
  type        = map(number)

  default = {
    default = 8080
    dev     = 8081
    test    = 8082
    prod    = 8083
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

locals {
  environment = terraform.workspace
  port        = lookup(var.environment_ports, local.environment, 8080)
}

resource "docker_image" "nginx" {
  name = var.image_name
}

resource "docker_container" "web" {
  name  = "web-${local.environment}"
  image = docker_image.nginx.image_id

  ports {
    internal = 80
    external = local.port
  }
}
```

> `lookup(map, clé, valeur_par_défaut)` retourne la valeur associée à la clé dans la map, ou la valeur par défaut si la clé est absente. Cela évite une erreur si un workspace est créé sans entrée correspondante dans la map des ports.

> `terraform.workspace` retourne le nom du workspace actif sous forme de chaîne. Dans le workspace `default`, la valeur est `"default"`.

## Fichier `outputs.tf`

```hcl
output "workspace" {
  description = "Workspace Terraform utilisé"
  value       = terraform.workspace
}

output "container_name" {
  description = "Nom du conteneur créé"
  value       = docker_container.web.name
}

output "application_url" {
  description = "URL locale de l'application"
  value       = "http://localhost:${local.port}"
}
```

## Étape 1 : initialiser le projet

```bash
terraform init
```

## Étape 2 : afficher le workspace courant

```bash
terraform workspace show
```

Par défaut, Terraform utilise le workspace `default`.

## Étape 3 : créer le premier environnement

Créer le workspace `dev` :

```bash
terraform workspace new dev
```

Vérifier le workspace actif :

```bash
terraform workspace show
```

Puis appliquer :

```bash
terraform plan
terraform apply
```

Tester : `http://localhost:8081`

## Étape 4 : créer un deuxième environnement

Créer le workspace `test` :

```bash
terraform workspace new test
terraform plan
terraform apply
```

Tester : `http://localhost:8082`

## Étape 5 : créer un troisième environnement

Créer le workspace `prod` :

```bash
terraform workspace new prod
terraform plan
terraform apply
```

Tester : `http://localhost:8083`

## Étape 6 : lister les workspaces

```bash
terraform workspace list
```

Exemple de résultat :

```
  default
  dev
  test
* prod
```

L'étoile indique le workspace actif.

## Étape 7 : passer d'un environnement à l'autre

Revenir sur `dev` :

```bash
terraform workspace select dev
terraform output
```

Passer sur `test` :

```bash
terraform workspace select test
terraform output
```

Chaque workspace possède son propre state. C'est pour cela que les conteneurs `web-dev`, `web-test` et `web-prod` peuvent exister simultanément.

## Étape 8 : modifier le port d'un environnement

Sélectionner `dev` :

```bash
terraform workspace select dev
```

Appliquer un port différent pour ce seul workspace avec `-var` :

```bash
terraform plan -var='environment_ports={"default":8080,"dev":8091,"test":8082,"prod":8083}'
terraform apply -var='environment_ports={"default":8080,"dev":8091,"test":8082,"prod":8083}'
```

Tester : `http://localhost:8091`

> **Attention** : `environment_ports` est défini dans `variables.tf` et partagé par tous les workspaces. Modifier la valeur `default` dans `variables.tf` changerait le port pour tous les environnements à leur prochain `apply`. Pour modifier un seul environnement, utiliser `-var` comme ci-dessus ou un fichier `.tfvars` dédié.

## Étape 9 : observer les states

Lister les ressources du workspace actif :

```bash
terraform state list
```

Changer de workspace et comparer :

```bash
terraform workspace select test
terraform state list
```

Chaque workspace maintient un state isolé -- les ressources de `dev` et `test` sont indépendantes.

## Étape 10 : supprimer un environnement

```bash
terraform workspace select dev
terraform destroy
terraform workspace select default
terraform workspace delete dev
```

> Un workspace ne peut être supprimé que s'il ne contient plus de ressources dans son state. `terraform destroy` doit être exécuté avant `terraform workspace delete`.

## Exercice 1 : ajouter un environnement `staging`

Ajouter un port dans `variables.tf` :

```hcl
default = {
  default = 8080
  dev     = 8081
  test    = 8082
  staging = 8084
  prod    = 8083
}
```

Créer le workspace et appliquer :

```bash
terraform workspace new staging
terraform plan
terraform apply
```

Tester : `http://localhost:8084`

## Exercice 2 : changer l'image selon l'environnement

> **Attention** : cet exercice renomme la ressource `docker_image.nginx` en `docker_image.web`. Terraform va **détruire l'ancienne ressource et en créer une nouvelle** -- ce qui entraîne aussi la recréation du conteneur. C'est un comportement normal lors d'un renommage de ressource dans le code.

Ajouter dans `variables.tf` :

```hcl
variable "environment_images" {
  description = "Images Docker utilisées selon le workspace"
  type        = map(string)

  default = {
    default = "nginx:latest"
    dev     = "nginx:alpine"
    test    = "httpd:latest"
    staging = "caddy:latest"
    prod    = "nginx:latest"
  }
}
```

Remplacer le contenu de `main.tf` par :

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

locals {
  environment = terraform.workspace
  port        = lookup(var.environment_ports, local.environment, 8080)
  image       = lookup(var.environment_images, local.environment, "nginx:latest")
}

resource "docker_image" "web" {
  name = local.image
}

resource "docker_container" "web" {
  name  = "web-${local.environment}"
  image = docker_image.web.image_id

  ports {
    internal = 80
    external = local.port
  }
}
```

Tester dans chaque workspace :

```bash
terraform workspace select dev
terraform plan && terraform apply

terraform workspace select test
terraform plan && terraform apply

terraform workspace select staging
terraform plan && terraform apply
```

## Exercice 3 : comprendre `lookup()` et la valeur par défaut

Le `main.tf` utilise déjà `lookup()` depuis le début du TP. Cet exercice explique pourquoi.

```hcl
port  = lookup(var.environment_ports, local.environment, 8080)
image = lookup(var.environment_images, local.environment, "nginx:latest")
```

`lookup(map, clé, valeur_par_défaut)` fonctionne ainsi :

- si la clé existe dans la map, la valeur associée est retournée
- si la clé est absente, la valeur par défaut (troisième argument) est retournée sans erreur

Sans `lookup`, un accès direct comme `var.environment_ports[local.environment]` provoquerait une erreur si le workspace ne figure pas dans la map.

Tester ce comportement :

```bash
terraform workspace new hotfix
terraform plan
```

Avec `lookup`, Terraform utilise le port `8080` et l'image `nginx:latest` par défaut. Sans `lookup`, l'exécution échoue.

## Exercice 4 : comprendre les limites des workspaces

Les workspaces sont utiles pour séparer plusieurs states avec le même code.

Ils ont cependant des limites importantes :

- le code est **identique** pour tous les environnements -- il est difficile d'avoir des configurations très différentes entre `dev` et `prod`
- les fichiers `variables.tf` et `main.tf` sont **partagés** -- une modification affecte potentiellement tous les workspaces au prochain `apply`
- en équipe, il est facile d'oublier dans quel workspace on se trouve avant d'exécuter un `apply` ou un `destroy`

Pour un environnement critique comme `prod`, une séparation par dossiers peut être préférable :

```
environments/
├── dev/
│   ├── main.tf
│   └── terraform.tfvars
├── test/
│   ├── main.tf
│   └── terraform.tfvars
└── prod/
    ├── main.tf
    └── terraform.tfvars
```

Cette approche donne un contrôle plus strict sur chaque environnement, au prix d'une duplication de code réduite par l'usage de modules.

## Nettoyage complet

Supprimer les ressources dans chaque workspace utilisé :

```bash
terraform workspace select dev && terraform destroy
terraform workspace select test && terraform destroy
terraform workspace select staging && terraform destroy
terraform workspace select prod && terraform destroy
```

Revenir sur `default` et supprimer les workspaces vides :

```bash
terraform workspace select default

terraform workspace delete dev
terraform workspace delete test
terraform workspace delete staging
terraform workspace delete prod
```

> Adapter la liste selon les workspaces effectivement créés pendant le TP.
