---
title: "TP 14 : Terragrunt avec Terraform/OpenTofu"
description: Structurer et orchestrer des projets Terraform/OpenTofu avec Terragrunt.
---

## Objectif

Utiliser Terragrunt pour structurer et orchestrer des projets Terraform/OpenTofu.

Ce TP permet de voir comment :

- structurer un projet Terragrunt avec un fichier `root.hcl` commun
- factoriser la configuration avec `include`
- passer des variables avec `inputs`
- utiliser un module Terraform/OpenTofu réutilisable
- chaîner deux unités avec `dependency`
- lancer des commandes sur plusieurs unités avec `terragrunt run-all`

Terragrunt considère une **unit** comme un dossier contenant un fichier `terragrunt.hcl`. C'est l'entité déployable la plus petite côté Terragrunt.

## Prérequis

- Terraform ou OpenTofu installé
- Terragrunt installé

Avec Terraform :

```bash
terraform version
terragrunt --version
```

Avec OpenTofu :

```bash
tofu version
terragrunt --version
```

> Ce TP a été écrit avec **Terragrunt >= 0.67**. La commande `run-all` (avec tiret) est la syntaxe actuelle. Les versions antérieures utilisaient `run --all` — les deux peuvent être présentes selon l'installation.

## Arborescence

```
tp-terragrunt/
├── .gitignore
├── modules/
│   ├── naming/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── app/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── live/
    ├── root.hcl
    └── dev/
        ├── naming/
        │   └── terragrunt.hcl
        └── app/
            └── terragrunt.hcl
```

## Fichier `.gitignore`

Créer à la racine du projet :

```
.terraform/
.terragrunt-cache/
*.tfstate
*.tfstate.*
.terraform.lock.hcl
*.tfvars
```

> `.terragrunt-cache/` est le dossier dans lequel Terragrunt copie les modules et génère les fichiers avant exécution. Il ne doit pas être versionné.

## Étape 1 : créer le module `naming`

Créer `modules/naming/variables.tf` :

```hcl
terraform {
  required_version = ">= 1.6"
}

variable "project" {
  description = "Nom du projet"
  type        = string
}

variable "environment" {
  description = "Environnement cible"
  type        = string
}
```

Créer `modules/naming/main.tf` :

```hcl
locals {
  name_prefix = "${var.project}-${var.environment}"
}
```

Créer `modules/naming/outputs.tf` :

```hcl
output "name_prefix" {
  description = "Préfixe de nom standardisé"
  value       = local.name_prefix
}
```

Ce module produit un préfixe de nom, par exemple `demo-dev`.

## Étape 2 : créer le module `app`

Créer `modules/app/variables.tf` :

```hcl
terraform {
  required_version = ">= 1.6"
}

variable "name_prefix" {
  description = "Préfixe issu du module naming"
  type        = string
}

variable "app_name" {
  description = "Nom de l'application"
  type        = string
}
```

Créer `modules/app/main.tf` :

```hcl
locals {
  full_app_name = "${var.name_prefix}-${var.app_name}"
}
```

Créer `modules/app/outputs.tf` :

```hcl
output "full_app_name" {
  description = "Nom complet de l'application"
  value       = local.full_app_name
}
```

Ce module recevra le résultat du module `naming` via `dependency`.

## Étape 3 : créer la configuration racine Terragrunt

Créer `live/root.hcl` :

```hcl
locals {
  project     = "demo"
  environment = "dev"
}

remote_state {
  backend = "local"

  generate = {
    path      = "backend.tf"
    if_exists = "overwrite"
  }

  config = {
    path = "${path_relative_to_include()}/terraform.tfstate"
  }
}
```

> **Backend local** : on utilise un backend local pour ce TP. En production, on utiliserait un backend distant (S3, GCS, AzureRM). Le bloc `remote_state` avec `generate` produit automatiquement un fichier `backend.tf` dans chaque unité avant l'exécution de Terraform/OpenTofu.
>
> `if_exists = "overwrite"` indique à Terragrunt d'écraser le `backend.tf` s'il existe déjà. Ne pas créer de `backend.tf` manuellement dans les modules — il serait écrasé.

## Étape 4 : créer l'unité `naming`

Créer `live/dev/naming/terragrunt.hcl` :

```hcl
include "root" {
  path   = find_in_parent_folders("root.hcl")
  expose = true
}

terraform {
  source = "../../../modules/naming"
}

inputs = {
  project     = include.root.locals.project
  environment = include.root.locals.environment
}
```

Le bloc `include` hérite de la configuration de `root.hcl`. `expose = true` permet d'accéder aux `locals` du fichier parent via `include.root.locals`.

Lancer depuis `live/dev/naming/` :

```bash
terragrunt init
terragrunt plan
terragrunt apply
```

Vérifier la sortie :

```bash
terragrunt output
```

Résultat attendu :

```
name_prefix = "demo-dev"
```

## Étape 5 : créer l'unité `app` avec une dépendance

Créer `live/dev/app/terragrunt.hcl` :

```hcl
include "root" {
  path   = find_in_parent_folders("root.hcl")
  expose = true
}

terraform {
  source = "../../../modules/app"
}

dependency "naming" {
  config_path = "../naming"
}

inputs = {
  name_prefix = dependency.naming.outputs.name_prefix
  app_name    = "api"
}
```

Le bloc `dependency` permet à une unité de lire les outputs d'une autre unité. Terragrunt s'assure que l'unité `naming` est déployée avant `app`.

Lancer depuis `live/dev/app/` :

```bash
terragrunt init
terragrunt plan
terragrunt apply
```

Vérifier :

```bash
terragrunt output
```

Résultat attendu :

```
full_app_name = "demo-dev-api"
```

## Étape 6 : exécuter tout le stack

Depuis `live/dev/` :

```bash
terragrunt run-all plan
```

Puis :

```bash
terragrunt run-all apply
```

`terragrunt run-all` exécute la commande Terraform/OpenTofu sur toutes les unités du dossier courant en respectant l'ordre des dépendances : `naming` est planifié et appliqué avant `app`.

> Pour la destruction globale, utiliser avec précaution :
>
> ```bash
> terragrunt run-all destroy
> ```
>
> Terragrunt détruit dans l'ordre **inverse** des dépendances : `app` est détruit avant `naming`. Confirmer l'ordre avant d'exécuter en production.

## Questions de validation

**1. À quoi sert le fichier `root.hcl` ?**
Il centralise la configuration commune à toutes les unités : backend, locals partagés (projet, environnement), configuration du provider. Chaque unité l'hérite via `include`, ce qui évite de répéter les mêmes paramètres.

**2. Quelle est la différence entre `inputs` et `dependency` ?**
`inputs` passe des valeurs statiques ou issues des `locals` directement au module Terraform. `dependency` permet de lire les outputs d'une autre unité Terragrunt déjà déployée : les valeurs sont dynamiques et connues seulement après l'`apply` de l'unité source.

**3. Pourquoi l'unité `app` doit-elle attendre l'unité `naming` ?**
Elle a besoin de la valeur de `name_prefix` produite par `naming`. Cette valeur n'existe qu'après l'`apply` de `naming`. Terragrunt résout l'ordre d'exécution automatiquement à partir des blocs `dependency`.

**4. Où Terragrunt stocke-t-il l'état Terraform dans ce TP ?**
Dans des fichiers `terraform.tfstate` locaux, un par unité, dans leur dossier respectif (`live/dev/naming/terraform.tfstate` et `live/dev/app/terraform.tfstate`). C'est la configuration du bloc `remote_state` dans `root.hcl`.

**5. Quelle commande permet d'exécuter un plan sur toutes les unités ?**
`terragrunt run-all plan` depuis le dossier parent des unités.

**6. Pourquoi faut-il être prudent avec `terragrunt run-all destroy` ?**
La commande détruit toutes les unités du dossier courant et de ses sous-dossiers dans l'ordre inverse des dépendances. En production, cela peut entraîner la destruction de ressources critiques si exécuté depuis un dossier trop haut dans l'arborescence.

## Exercice 1 : ajouter un environnement `prod`

Créer la structure suivante :

```
live/prod/
├── env.hcl
├── naming/
│   └── terragrunt.hcl
└── app/
    └── terragrunt.hcl
```

Créer `live/prod/env.hcl` :

```hcl
locals {
  environment = "prod"
}
```

Dans `live/prod/naming/terragrunt.hcl`, surcharger l'environnement en lisant `env.hcl` :

```hcl
include "root" {
  path   = find_in_parent_folders("root.hcl")
  expose = true
}

locals {
  env = read_terragrunt_config(find_in_parent_folders("env.hcl"))
}

terraform {
  source = "../../../modules/naming"
}

inputs = {
  project     = include.root.locals.project
  environment = local.env.locals.environment
}
```

Appliquer et vérifier que le résultat est `demo-prod`.

> `read_terragrunt_config()` lit un fichier `.hcl` Terragrunt et expose ses `locals`. C'est le pattern standard pour surcharger des variables par environnement sans modifier `root.hcl`.

## Exercice 2 : ajouter une deuxième application

Créer une unité `live/dev/worker/terragrunt.hcl` qui réutilise le module `app`, dépend de `naming` et produit :

```
demo-dev-worker
```

## Exercice 3 : observer les fichiers générés

Après un `terragrunt init`, observer les fichiers générés par Terragrunt :

```bash
find . -name "backend.tf"
find . -type d -name ".terragrunt-cache"
```

Terragrunt copie le module source dans `.terragrunt-cache/` et y génère les fichiers nécessaires (`backend.tf`, éventuellement `provider.tf`) avant d'exécuter Terraform/OpenTofu.

## Nettoyage

Depuis `live/dev/` :

```bash
terragrunt run-all destroy
```

Terragrunt détruit `app` avant `naming` (ordre inverse des dépendances).

Supprimer les caches locaux :

```bash
find . -type d -name ".terragrunt-cache" -prune -exec rm -rf {} +
find . -type d -name ".terraform" -prune -exec rm -rf {} +
find . -name ".terraform.lock.hcl" -delete
find . -name "terraform.tfstate" -delete
find . -name "terraform.tfstate.backup" -delete
```
