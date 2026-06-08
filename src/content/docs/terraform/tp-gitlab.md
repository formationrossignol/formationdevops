---
title: "TP Terraform : gérer un projet GitLab"
description: Créer et gérer des ressources GitLab avec Terraform - projets, labels, variables CI/CD.
---

## Objectif

Créer et gérer des ressources GitLab avec Terraform :

- créer un projet GitLab
- créer des labels
- créer des variables CI/CD
- observer les changements avec `terraform plan`
- appliquer les changements avec `terraform apply`
- comprendre l'intérêt de gérer GitLab en Infrastructure as Code

Le provider GitLab officiel sur Terraform Registry est `gitlabhq/gitlab`. Il permet d'interagir avec des ressources GitLab comme les projets, groupes, variables, labels et autres objets GitLab.

## Authentification GitLab

Le token ne doit jamais être écrit dans les fichiers Terraform. Le provider GitLab lit nativement la variable d'environnement `GITLAB_TOKEN` -- aucune configuration supplémentaire n'est nécessaire dans les fichiers `.tf`.

Sous Linux ou macOS :

```bash
export GITLAB_TOKEN="glpat_xxxxxxxxxxxxxxxxxxxx"
```

Sous PowerShell :

```powershell
$env:GITLAB_TOKEN="glpat_xxxxxxxxxxxxxxxxxxxx"
```

Définir cette variable avant toute commande `terraform`.

## Prérequis

- Terraform installé
- Git installé
- Un compte GitLab gratuit
- Un token GitLab personnel avec les permissions `api`

## Arborescence du projet

```
tp-terraform-gitlab/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars.example
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
variable "project_name" {
  description = "Nom du projet GitLab à créer"
  type        = string
  default     = "tp-terraform-gitlab"
}

variable "project_description" {
  description = "Description du projet GitLab"
  type        = string
  default     = "Projet GitLab créé avec Terraform"
}

variable "visibility_level" {
  description = "Visibilité du projet GitLab"
  type        = string
  default     = "private"
}

variable "labels" {
  description = "Labels GitLab à créer"
  type = map(object({
    color       = string
    description = string
  }))

  default = {
    bug = {
      color       = "#d73a4a"
      description = "Anomalie à corriger"
    }

    documentation = {
      color       = "#0075ca"
      description = "Documentation à créer ou modifier"
    }

    terraform = {
      color       = "#623ce4"
      description = "Ressource gérée avec Terraform"
    }
  }
}
```

> **Note** : Les couleurs des labels GitLab sont des codes hexadécimaux **avec le `#`**. Exemple : `"#d73a4a"`. C'est l'inverse du provider GitHub qui attend la couleur sans `#`.

## Fichier `main.tf`

```hcl
terraform {
  required_providers {
    gitlab = {
      source  = "gitlabhq/gitlab"
      version = "~> 19.0"
    }
  }
}

provider "gitlab" {}

resource "gitlab_project" "tp" {
  name                   = var.project_name
  description            = var.project_description
  visibility_level       = var.visibility_level
  initialize_with_readme = true
}

resource "gitlab_label" "labels" {
  for_each = var.labels

  project     = gitlab_project.tp.id
  name        = each.key
  color       = each.value.color
  description = each.value.description
}

resource "gitlab_project_variable" "environment" {
  project = gitlab_project.tp.id
  key     = "ENVIRONMENT"
  value   = "dev"
}

resource "gitlab_project_variable" "app_name" {
  project = gitlab_project.tp.id
  key     = "APP_NAME"
  value   = var.project_name
}
```

> Le bloc `provider "gitlab" {}` est vide : le provider lit automatiquement `GITLAB_TOKEN` depuis l'environnement. Aucune variable Terraform n'est nécessaire pour le token.
>
> Les labels utilisent `for_each` dès le départ -- chaque label est identifié par sa clé (`"bug"`, `"documentation"`, `"terraform"`), ce qui permet d'en ajouter ou supprimer un sans affecter les autres.

## Fichier `outputs.tf`

```hcl
output "project_name" {
  description = "Nom du projet GitLab"
  value       = gitlab_project.tp.name
}

output "project_url" {
  description = "URL du projet GitLab"
  value       = gitlab_project.tp.web_url
}

output "project_id" {
  description = "ID du projet GitLab"
  value       = gitlab_project.tp.id
}
```

## Fichier `terraform.tfvars.example`

```
project_name        = "tp-terraform-gitlab"
project_description = "Projet GitLab créé avec Terraform"
visibility_level    = "private"
```

Copier le fichier :

```bash
cp terraform.tfvars.example terraform.tfvars
```

## Commandes à exécuter

```bash
terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
```

## Vérifications dans GitLab

Après l'application, vérifier que :

- le projet GitLab existe
- le README a été initialisé
- les labels `bug`, `documentation` et `terraform` sont présents
- les variables CI/CD `ENVIRONMENT` et `APP_NAME` sont présentes dans **Settings > CI/CD > Variables**

## Exercice 1 : modifier la description du projet

Modifier dans `terraform.tfvars` :

```
project_description = "Projet GitLab modifié avec Terraform"
```

Puis exécuter :

```bash
terraform plan
terraform apply
```

La sortie du `plan` doit afficher `~ update in-place` -- Terraform modifie la description sans recréer le projet.

## Exercice 2 : ajouter un label

Ajouter l'entrée `enhancement` dans la variable `labels` de `variables.tf` :

```hcl
default = {
  bug = {
    color       = "#d73a4a"
    description = "Anomalie à corriger"
  }

  documentation = {
    color       = "#0075ca"
    description = "Documentation à créer ou modifier"
  }

  terraform = {
    color       = "#623ce4"
    description = "Ressource gérée avec Terraform"
  }

  enhancement = {
    color       = "#a2eeef"
    description = "Nouvelle fonctionnalité"
  }
}
```

Puis exécuter :

```bash
terraform plan
terraform apply
```

Terraform doit proposer uniquement la création de `gitlab_label.labels["enhancement"]`, sans toucher aux trois labels existants.

## Exercice 3 : ajouter une variable CI/CD

Ajouter dans `main.tf` :

```hcl
resource "gitlab_project_variable" "debug" {
  project = gitlab_project.tp.id
  key     = "DEBUG"
  value   = "false"
}
```

Puis exécuter :

```bash
terraform plan
terraform apply
```

## Exercice 4 : observer une dérive

Aller dans l'interface GitLab, ouvrir **Manage > Labels** du projet, et modifier manuellement la couleur du label `bug` (par exemple, passer de `#d73a4a` à `#ee0701`).

Puis exécuter :

```bash
terraform plan
```

Terraform doit détecter une différence et afficher `~ update in-place` sur `gitlab_label.labels["bug"]` avec l'ancienne et la nouvelle valeur de couleur.

Rétablir l'état décrit dans le code :

```bash
terraform apply
```

> Le code Terraform est la source de vérité. Toute modification manuelle est une dérive que Terraform corrige au prochain `apply`.

## Protection contre la suppression accidentelle

Ajouter le bloc `lifecycle` dans la ressource `gitlab_project` :

```hcl
resource "gitlab_project" "tp" {
  name                   = var.project_name
  description            = var.project_description
  visibility_level       = var.visibility_level
  initialize_with_readme = true

  lifecycle {
    prevent_destroy = true
  }
}
```

Appliquer :

```bash
terraform apply
```

Tenter ensuite `terraform destroy` pour observer le message d'erreur :

```
Error: Instance cannot be destroyed
  Resource gitlab_project.tp has lifecycle.prevent_destroy set to true.
```

## Nettoyage

> **Si vous avez appliqué `prevent_destroy`**, retirer d'abord le bloc `lifecycle` de la ressource `gitlab_project`, puis relancer `terraform apply` avant de continuer.

Supprimer toutes les ressources créées :

```bash
terraform destroy
```

Cette commande supprime le projet GitLab créé par Terraform, ainsi que tous les labels et variables CI/CD associés.
