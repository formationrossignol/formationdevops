---
title: "TP 10 : Gérer un dépôt GitHub avec Terraform"
description: Créer et administrer un dépôt GitHub avec le provider Terraform.
---

## Objectif

Créer et administrer un dépôt GitHub avec Terraform.

Ce TP permet de voir comment :

- créer un repository GitHub
- ajouter une description
- créer des labels
- créer une issue
- modifier la configuration
- observer le résultat avec `terraform plan`
- appliquer les changements avec `terraform apply`

## Authentification GitHub

Le token GitHub ne doit jamais être écrit dans un fichier Terraform, ni dans `terraform.tfvars`.
Il doit être fourni via une variable d'environnement avant toute commande Terraform.

Sous Linux ou macOS :

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxx"
```

Sous PowerShell :

```powershell
$env:GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxx"
```

Le provider GitHub lit automatiquement cette variable. Aucune autre configuration n'est nécessaire.

## Prérequis

- Terraform installé
- Git installé
- Un compte GitHub gratuit
- Un token GitHub personnel avec les permissions `repo` et `delete_repo`

## Arborescence du projet

```
tp-terraform-github/
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
variable "github_owner" {
  description = "Nom du compte GitHub ou de l'organisation"
  type        = string
}

variable "repository_name" {
  description = "Nom du dépôt GitHub à créer"
  type        = string
  default     = "tp-terraform-github"
}

variable "repository_description" {
  description = "Description du dépôt"
  type        = string
  default     = "Dépôt créé avec Terraform dans le cadre d'un TP"
}
```

## Fichier `main.tf`

> La version `~> 5.45` est utilisée car la ressource `github_issue` a été supprimée du provider à partir de la v6.

```hcl
terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 5.45"
    }
  }
}

provider "github" {
  owner = var.github_owner
}

resource "github_repository" "tp" {
  name        = var.repository_name
  description = var.repository_description
  visibility  = "public"

  has_issues = true
  auto_init  = true
}

resource "github_issue_label" "bug" {
  repository  = github_repository.tp.name
  name        = "bug"
  color       = "d73a4a"
  description = "Something is not working"
}

resource "github_issue_label" "documentation" {
  repository  = github_repository.tp.name
  name        = "documentation"
  color       = "0075ca"
  description = "Improvements or additions to documentation"
}

resource "github_issue_label" "terraform" {
  repository  = github_repository.tp.name
  name        = "terraform"
  color       = "623ce4"
  description = "Managed with Terraform"
}

resource "github_issue" "welcome" {
  repository = github_repository.tp.name
  title      = "Bienvenue dans le TP Terraform"
  body       = "Cette issue a été créée automatiquement avec Terraform."

  labels = [
    github_issue_label.documentation.name,
    github_issue_label.terraform.name
  ]
}
```

> **Note** : Les couleurs des labels sont des codes hexadécimaux **sans le `#`**. Exemple : `"d73a4a"` et non `"#d73a4a"`. L'API GitHub attend ce format.

## Fichier `outputs.tf`

```hcl
output "repository_url" {
  description = "URL du dépôt créé"
  value       = github_repository.tp.html_url
}

output "issue_url" {
  description = "URL de l'issue créée"
  value       = github_issue.welcome.html_url
}
```

## Fichier `terraform.tfvars.example`

```
github_owner    = "votre-compte-github"
repository_name = "tp-terraform-github"
```

Copier le fichier d'exemple :

```bash
cp terraform.tfvars.example terraform.tfvars
```

Modifier ensuite la valeur de `github_owner` avec le nom du compte GitHub utilisé.

## Commandes à exécuter

Initialiser le projet :

```bash
terraform init
```

Formater les fichiers :

```bash
terraform fmt
```

Vérifier la configuration :

```bash
terraform validate
```

Afficher les changements prévus :

```bash
terraform plan
```

Créer les ressources :

```bash
terraform apply
```

Vérifier ensuite dans GitHub que le dépôt, les labels et l'issue ont bien été créés.

## Exercice 1 : modifier la description du dépôt

Modifier la valeur dans `terraform.tfvars` :

```
repository_description = "Dépôt Terraform modifié pendant le TP"
```

Puis exécuter :

```bash
terraform plan
terraform apply
```

Observer si Terraform recrée le dépôt ou modifie seulement sa description.
La sortie du `plan` doit afficher `~ update in-place` -- Terraform modifie la ressource existante sans la recréer.

## Exercice 2 : ajouter un label

Ajouter ce bloc dans `main.tf` :

```hcl
resource "github_issue_label" "enhancement" {
  repository  = github_repository.tp.name
  name        = "enhancement"
  color       = "a2eeef"
  description = "New feature or request"
}
```

Puis exécuter :

```bash
terraform plan
terraform apply
```

## Exercice 3 : créer une seconde issue

Ajouter ce bloc dans `main.tf` :

```hcl
resource "github_issue" "todo" {
  repository = github_repository.tp.name
  title      = "Ajouter un README"
  body       = "Créer un README clair pour expliquer le projet."

  labels = [
    github_issue_label.documentation.name
  ]
}
```

Puis exécuter :

```bash
terraform plan
terraform apply
```

## Exercice 4 : observer une dérive

Aller dans l'interface GitHub, ouvrir l'onglet **Issues > Labels** du dépôt, et modifier la couleur du label `bug` manuellement (par exemple, passer de `#d73a4a` à `#ee0701`).

Puis exécuter :

```bash
terraform plan
```

Terraform doit détecter une différence entre la configuration locale et l'état réel sur GitHub.
La sortie doit afficher une ligne `~ update in-place` sur le label `bug` avec l'ancienne et la nouvelle valeur de couleur.

Appliquer pour rétablir l'état décrit dans le code :

```bash
terraform apply
```

> C'est le principe fondamental de l'IaC : le code est la source de vérité. Toute modification manuelle est une dérive que Terraform corrige.

## Exercice 5 : protéger le dépôt contre la suppression

Ajouter un bloc `lifecycle` dans la ressource `github_repository` :

```hcl
resource "github_repository" "tp" {
  name        = var.repository_name
  description = var.repository_description
  visibility  = "public"

  has_issues = true
  auto_init  = true

  lifecycle {
    prevent_destroy = true
  }
}
```

Appliquer :

```bash
terraform apply
```

Tenter ensuite de détruire les ressources :

```bash
terraform destroy
```

Terraform refusera la destruction avec l'erreur suivante :

```
Error: Instance cannot be destroyed
  Resource github_repository.tp has lifecycle.prevent_destroy set to true.
```

## Nettoyage

> **Si vous avez appliqué l'exercice 5**, retirez d'abord le bloc `lifecycle { prevent_destroy = true }` de la ressource `github_repository`, puis relancez `terraform apply` avant de continuer.

Supprimer toutes les ressources créées :

```bash
terraform destroy
```

Cette commande supprime le dépôt GitHub créé par Terraform, ainsi que tous les labels et issues associés.
