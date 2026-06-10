---
title: "TP 6 : Tester un module avec terraform test"
description: Créer un module Terraform et écrire des tests automatisés avec terraform test.
---

## Objectif

Créer un module Terraform simple, puis écrire des tests automatisés avec `terraform test`.

Le TP permet de tester :

- les variables d'entrée d'un module
- les outputs
- la logique interne d'un module
- les cas valides
- les cas invalides
- l'exécution automatique des tests

Terraform détecte les fichiers de test avec les extensions `.tftest.hcl` ou `.tftest.json`. Par défaut, `terraform test` cherche les tests dans le dossier courant et dans un sous-dossier `tests/`.

## Prérequis

- Terraform **>= 1.6** installé (`terraform test` est disponible depuis la version 1.6.0)
- Un terminal
- Un éditeur de code

```bash
terraform version
```

La version affichée doit être 1.6.0 ou supérieure. En dessous, la commande `terraform test` n'existe pas.

## Sujet du TP

Créer un module local qui génère un nom standardisé pour une ressource.

Exemples attendus :

```
app-dev-web
app-prod-api
app-test-db
```

Le module ne crée pas d'infrastructure réelle : il est entièrement testable en local, sans provider ni compte cloud.

## Arborescence

```
tp-terraform-test/
├── main.tf
├── variables.tf
├── outputs.tf
├── tests/
│   ├── naming_valid.tftest.hcl
│   └── naming_invalid.tftest.hcl
└── .gitignore
```

## Fichier `.gitignore`

```
.terraform/
*.tfstate
*.tfstate.*
.terraform.lock.hcl
```

## Fichier `variables.tf`

```hcl
variable "project" {
  description = "Nom du projet"
  type        = string

  validation {
    condition     = length(var.project) >= 2
    error_message = "Le nom du projet doit contenir au moins 2 caractères."
  }
}

variable "environment" {
  description = "Environnement cible"
  type        = string

  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "L'environnement doit être dev, test ou prod."
  }
}

variable "component" {
  description = "Composant applicatif"
  type        = string

  validation {
    condition     = length(var.component) >= 2
    error_message = "Le composant doit contenir au moins 2 caractères."
  }
}
```

## Fichier `main.tf`

```hcl
terraform {
  required_version = ">= 1.6"
}

locals {
  resource_name = lower("${var.project}-${var.environment}-${var.component}")
}
```

> Le bloc `terraform { required_version = ">= 1.6" }` est nécessaire pour que Terraform signale une erreur claire si la version utilisée ne supporte pas `terraform test`.
>
> Ce module ne déclare aucun provider car il ne crée aucune ressource réelle. `terraform init` réussit sans télécharger de plugin.

## Fichier `outputs.tf`

```hcl
output "resource_name" {
  description = "Nom standardisé de la ressource"
  value       = local.resource_name
}

output "environment" {
  description = "Environnement utilisé"
  value       = var.environment
}
```

## Étape 1 : initialiser le projet

```bash
terraform init
```

## Étape 2 : créer un premier test valide

Créer le fichier `tests/naming_valid.tftest.hcl` :

```hcl
run "valid_dev_web_name" {
  command = plan

  variables {
    project     = "app"
    environment = "dev"
    component   = "web"
  }

  assert {
    condition     = output.resource_name == "app-dev-web"
    error_message = "Le nom généré devrait être app-dev-web."
  }

  assert {
    condition     = output.environment == "dev"
    error_message = "L'environnement devrait être dev."
  }
}
```

> Un fichier `.tftest.hcl` contient un ou plusieurs blocs `run`. Chaque bloc `run` exécute une commande Terraform (`plan` ou `apply`) et évalue des assertions sur les outputs ou les attributs des ressources.

## Étape 3 : exécuter les tests

```bash
terraform test
```

Résultat attendu :

```
Success! 1 passed, 0 failed.
```

## Étape 4 : ajouter plusieurs cas valides

Remplacer le contenu de `tests/naming_valid.tftest.hcl` par :

```hcl
run "valid_dev_web_name" {
  command = plan

  variables {
    project     = "app"
    environment = "dev"
    component   = "web"
  }

  assert {
    condition     = output.resource_name == "app-dev-web"
    error_message = "Le nom généré devrait être app-dev-web."
  }
}

run "valid_prod_api_name" {
  command = plan

  variables {
    project     = "app"
    environment = "prod"
    component   = "api"
  }

  assert {
    condition     = output.resource_name == "app-prod-api"
    error_message = "Le nom généré devrait être app-prod-api."
  }
}

run "valid_uppercase_input" {
  command = plan

  variables {
    project     = "APP"
    environment = "test"
    component   = "DB"
  }

  assert {
    condition     = output.resource_name == "app-test-db"
    error_message = "Le nom généré devrait être en minuscules même si l'entrée est en majuscules."
  }
}
```

```bash
terraform test
```

Résultat attendu :

```
Success! 3 passed, 0 failed.
```

## Étape 5 : tester un cas invalide

Créer le fichier `tests/naming_invalid.tftest.hcl` :

```hcl
run "invalid_environment" {
  command = plan

  variables {
    project     = "app"
    environment = "staging"
    component   = "web"
  }

  expect_failures = [
    var.environment
  ]
}
```

> `expect_failures` indique à Terraform que cette exécution doit échouer sur la validation de `var.environment`. Si le module échoue bien pour cette raison, le test est considéré réussi.

```bash
terraform test
```

Résultat attendu :

```
Success! 4 passed, 0 failed.
```

## Étape 6 : ajouter un second test invalide

Dans `tests/naming_invalid.tftest.hcl`, ajouter :

```hcl
run "invalid_project_too_short" {
  command = plan

  variables {
    project     = "a"
    environment = "dev"
    component   = "web"
  }

  expect_failures = [
    var.project
  ]
}
```

```bash
terraform test
```

Résultat attendu :

```
Success! 5 passed, 0 failed.
```

## Étape 7 : provoquer volontairement une erreur

**Modification 1 : supprimer la normalisation en minuscules**

Dans `main.tf`, remplacer :

```hcl
locals {
  resource_name = lower("${var.project}-${var.environment}-${var.component}")
}
```

par :

```hcl
locals {
  resource_name = "${var.project}-${var.environment}-${var.component}"
}
```

```bash
terraform test
```

Seul le test `valid_uppercase_input` doit échouer. Remettre la version correcte avec `lower()`.

**Modification 2 : changer le séparateur**

Remplacer les tirets par des underscores :

```hcl
locals {
  resource_name = lower("${var.project}_${var.environment}_${var.component}")
}
```

```bash
terraform test
```

Tous les tests sur le format du nom échouent. Remettre la version correcte avant de continuer.

## Étape 8 : afficher plus de détails

```bash
terraform test -verbose
```

Affiche chaque assertion évaluée et sa valeur : utile pour le débogage en cas d'échec.

## Étape 9 : exécuter un seul fichier de test

```bash
terraform test -filter=tests/naming_valid.tftest.hcl
terraform test -filter=tests/naming_invalid.tftest.hcl
```

Utile pour cibler un seul fichier lors du développement ou pour réexécuter uniquement les tests échoués.

## Étape 10 : intégrer les tests dans un script local

Créer un fichier `test.sh` :

```bash
#!/bin/bash
set -e

echo "==> Vérification du formatage Terraform..."
if ! terraform fmt -check; then
  echo "Erreur : des fichiers Terraform ne sont pas correctement formatés."
  echo "Lancer 'terraform fmt' pour corriger automatiquement."
  exit 1
fi

echo "==> Validation de la configuration Terraform..."
terraform validate

echo "==> Exécution des tests Terraform..."
if [ "${1}" = "-v" ]; then
  terraform test -verbose
else
  terraform test
fi

echo "==> Tous les tests sont passés."
```

```bash
chmod +x test.sh
./test.sh        # exécution normale
./test.sh -v     # sortie détaillée
```

## Variante : tester un vrai module local

Pour structurer le projet avec un module séparé :

```
tp-terraform-test/
├── modules/
│   └── naming/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── tests/
    └── naming.tftest.hcl
```

Déplacer les fichiers dans `modules/naming/`, puis dans `tests/naming.tftest.hcl` :

```hcl
run "test_naming_module" {
  command = plan

  module {
    source = "./modules/naming"
  }

  variables {
    project     = "app"
    environment = "dev"
    component   = "web"
  }

  assert {
    condition     = output.resource_name == "app-dev-web"
    error_message = "Le nom généré devrait être app-dev-web."
  }
}
```

```bash
terraform init
terraform test
```

## Variante CI/CD GitLab

```yaml
stages:
  - test

terraform_test:
  image: hashicorp/terraform:1.9
  stage: test
  script:
    - terraform init
    - terraform fmt -check
    - terraform validate
    - terraform test
```

> L'image `hashicorp/terraform:1.9` est épinglée sur une version majeure stable. Éviter `latest` dans une pipeline.

## Variante GitHub Actions

```yaml
name: Terraform Tests

on:
  pull_request:
  push:

jobs:
  terraform-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.9"

      - name: Terraform init
        run: terraform init

      - name: Terraform fmt
        run: terraform fmt -check

      - name: Terraform validate
        run: terraform validate

      - name: Terraform test
        run: terraform test
```
