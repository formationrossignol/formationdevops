---
title: "TP 12 : Estimer le coût d'une infrastructure avec Infracost"
description: Utiliser Infracost pour estimer le coût mensuel d'une infrastructure Terraform avant son déploiement.
---

## Objectif

Utiliser Infracost pour estimer le coût mensuel d'une infrastructure Terraform avant son déploiement.

Ce TP permet de voir comment :

- écrire une configuration Terraform cloud simple
- estimer le coût avec Infracost
- comparer deux versions d'une infrastructure
- détecter une hausse de coût avant application
- préparer une intégration CI/CD

Infracost analyse des configurations Terraform ou des plans Terraform JSON pour produire une estimation de coûts cloud.

## Principe du TP

Le TP utilise une configuration Terraform AWS comme exemple, mais l'objectif est l'estimation de coût, pas le déploiement réel.

**`terraform apply` ne doit pas être exécuté.**

Pour éviter tout risque de facturation, on se limite à :

```bash
terraform init
terraform validate
infracost breakdown
```

## Prérequis

- Terraform installé
- Infracost CLI installé
- `jq` installé (pour le script de l'étape 10)
- Un terminal et un éditeur de code
- Une clé API Infracost gratuite

> Infracost utilise une API de pricing pour récupérer les prix. Le fichier de plan JSON, les credentials cloud et les secrets ne sont pas envoyés à cette API.

## Installation d'Infracost

Sous macOS avec Homebrew :

```bash
brew install infracost
```

Sous Linux :

```bash
curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh
```

Sous Windows avec Chocolatey :

```powershell
choco install infracost
```

Vérifier :

```bash
infracost --version
```

Configurer l'authentification (clé API gratuite) :

```bash
infracost auth login
```

## Arborescence

```
tp-terraform-infracost/
├── main.tf
├── variables.tf
├── outputs.tf
├── versions.tf
├── dev.tfvars
├── prod.tfvars
└── .gitignore
```

## Fichier `.gitignore`

```
.terraform/
*.tfstate
*.tfstate.*
.terraform.lock.hcl
*.tfvars
tfplan.binary
tfplan.json
infracost*.json
```

## Fichier `versions.tf`

```hcl
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

## Fichier `variables.tf`

```hcl
variable "aws_region" {
  description = "Région AWS utilisée pour l'estimation"
  type        = string
  default     = "eu-west-3"
}

variable "instance_type" {
  description = "Type d'instance EC2"
  type        = string
  default     = "t3.micro"
}

variable "environment" {
  description = "Nom de l'environnement"
  type        = string
  default     = "dev"
}
```

## Fichier `main.tf`

```hcl
provider "aws" {
  region = var.aws_region

  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
}

resource "aws_instance" "web" {
  ami           = "ami-1234567890abcdef0"
  instance_type = var.instance_type

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name        = "tp-infracost-${var.environment}"
    Environment = var.environment
  }
}
```

## Fichier `outputs.tf`

```hcl
output "instance_type" {
  description = "Type d'instance EC2 estimé"
  value       = aws_instance.web.instance_type
}

output "environment" {
  description = "Environnement ciblé"
  value       = var.environment
}
```

## Fichier `dev.tfvars`

```hcl
environment   = "dev"
instance_type = "t3.micro"
aws_region    = "eu-west-3"
```

## Fichier `prod.tfvars`

```hcl
environment   = "prod"
instance_type = "t3.large"
aws_region    = "eu-west-3"
```

## Étape 1 : initialiser Terraform

```bash
terraform init
```

## Étape 2 : vérifier le code

```bash
terraform fmt
terraform validate
```

> `terraform plan` nécessite des credentials AWS valides pour s'exécuter complètement, même avec `skip_credentials_validation = true`. Pour ce TP, Infracost analyse directement les fichiers HCL sans passer par un plan Terraform — ce qui est suffisant et évite tout besoin de compte AWS.

## Étape 3 : estimer le coût depuis le dossier Terraform

```bash
infracost breakdown --path .
```

`infracost breakdown` lit les fichiers HCL du dossier courant et génère une estimation de coût sans exécuter Terraform.

## Étape 4 : comparer les coûts dev et prod

Estimer le coût pour `dev` :

```bash
infracost breakdown --path . --terraform-var-file dev.tfvars
```

Estimer le coût pour `prod` :

```bash
infracost breakdown --path . --terraform-var-file prod.tfvars
```

Observer la différence de coût entre `t3.micro` et `t3.large`.

> Ne pas modifier la valeur `default` dans `variables.tf` pour changer le type d'instance — utiliser `--terraform-var-file` ou `--terraform-var instance_type=t3.large` directement dans la commande Infracost.

## Étape 5 : générer un rapport JSON

```bash
infracost breakdown --path . --format json --out-file infracost.json
```

Ce fichier peut être archivé comme rapport de coût ou utilisé dans une pipeline CI/CD.

## Étape 6 : comparer deux scénarios avec `infracost diff`

Générer l'estimation de base (dev) :

```bash
infracost breakdown \
  --path . \
  --terraform-var-file dev.tfvars \
  --format json \
  --out-file infracost-dev.json
```

Comparer avec le scénario prod :

```bash
infracost diff \
  --path . \
  --terraform-var-file prod.tfvars \
  --compare-to infracost-dev.json
```

`infracost diff` est la commande conçue pour comparer deux estimations — elle affiche les ressources ajoutées, modifiées ou supprimées ainsi que la variation de coût globale, ce qui est plus lisible qu'une comparaison manuelle de deux tableaux.

## Étape 7 : générer un plan Terraform JSON et l'analyser

> Cette étape nécessite des credentials AWS valides pour que `terraform plan` s'exécute. Si vous n'avez pas de compte AWS, utiliser directement `infracost breakdown --path .` comme aux étapes précédentes — le résultat est équivalent pour l'estimation.

Avec des credentials AWS configurés :

```bash
terraform plan -out tfplan.binary
terraform show -json tfplan.binary > tfplan.json
infracost breakdown --path tfplan.json
```

L'avantage du plan JSON est qu'Infracost évalue les valeurs effectives après résolution complète des variables et des modules, ce qui peut donner une estimation plus précise dans les configurations complexes.

## Étape 8 : ajouter une ressource coûteuse

Ajouter dans `main.tf` :

```hcl
resource "aws_ebs_volume" "data" {
  availability_zone = "eu-west-3a"
  size              = 100
  type              = "gp3"

  tags = {
    Name        = "tp-infracost-data-${var.environment}"
    Environment = var.environment
  }
}
```

> Le volume EBS est déclaré sans être attaché à l'instance — c'est intentionnel pour cet exercice. L'objectif est uniquement d'observer l'impact sur l'estimation de coût. Infracost estime les ressources indépendamment de leur attachement.

Relancer :

```bash
infracost breakdown --path .
```

Observer l'impact du volume de 100 Go gp3 sur le coût mensuel estimé.

## Étape 9 : afficher uniquement le coût total

```bash
infracost breakdown --path . --format json --out-file infracost.json
jq -r '"Coût mensuel estimé : " + .totalMonthlyCost + " USD"' infracost.json
```

## Étape 10 : ajouter un seuil de coût dans un script

Créer un fichier `cost-check.sh` :

```bash
#!/bin/bash
set -e

infracost breakdown \
  --path . \
  --format json \
  --out-file infracost.json

MONTHLY_COST=$(jq -r '.totalMonthlyCost // empty' infracost.json)

if [ -z "$MONTHLY_COST" ]; then
  echo "Erreur : impossible de lire le coût estimé depuis infracost.json."
  echo "Vérifier qu'Infracost a bien généré le rapport."
  exit 1
fi

echo "Coût mensuel estimé : ${MONTHLY_COST} USD"

LIMIT=20

if awk "BEGIN {exit !($MONTHLY_COST > $LIMIT)}"; then
  echo "Erreur : le coût estimé (${MONTHLY_COST} USD) dépasse le seuil de ${LIMIT} USD/mois."
  exit 1
fi

echo "Coût estimé acceptable (< ${LIMIT} USD/mois)."
```

Rendre le script exécutable :

```bash
chmod +x cost-check.sh
```

Lancer :

```bash
./cost-check.sh
```

Ce script requiert `jq`. Installer avec `brew install jq` (macOS), `apt install jq` (Linux) ou `choco install jq` (Windows).

## Variante GitLab CI

```yaml
stages:
  - cost

infracost:
  image:
    name: infracost/infracost:0.10
    entrypoint: [""]
  stage: cost
  variables:
    INFRACOST_API_KEY: "$INFRACOST_API_KEY"
  script:
    - infracost breakdown --path . --format json --out-file infracost.json
    - infracost output --path infracost.json --format table
  artifacts:
    paths:
      - infracost.json
    expire_in: 7 days
```

> L'image `infracost/infracost:0.10` est épinglée sur une version majeure stable. Éviter `latest` en CI/CD — le comportement peut changer lors d'une mise à jour sans avertissement. Vérifier la dernière version sur [hub.docker.com/r/infracost/infracost](https://hub.docker.com/r/infracost/infracost/tags).

## Variante GitHub Actions

```yaml
name: Infracost

on:
  pull_request:
  push:

jobs:
  infracost:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Infracost
        uses: infracost/actions/setup@v3
        with:
          api-key: ${{ secrets.INFRACOST_API_KEY }}

      - name: Generate cost estimate
        run: |
          infracost breakdown --path . --format json --out-file infracost.json
          infracost output --path infracost.json --format table

      - name: Upload cost report
        uses: actions/upload-artifact@v4
        with:
          name: infracost-report
          path: infracost.json
```

## Point important

Ce TP ne doit pas utiliser `terraform apply`. L'objectif est d'estimer le coût avant déploiement, pas de créer les ressources.
