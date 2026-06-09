---
title: "TP 11 : Sécurité IaC avec Trivy"
description: Scanner du code Terraform pour détecter des problèmes de sécurité avant le déploiement.
---

## Objectif

Scanner du code Terraform en local pour détecter des problèmes de sécurité avant le déploiement.

Ce TP permet de voir comment :

- analyser une configuration Terraform
- détecter des mauvaises pratiques IaC
- corriger une configuration risquée
- scanner un dossier Terraform
- scanner un plan Terraform
- intégrer Trivy dans une pipeline CI/CD

Trivy est un scanner open source capable d'analyser des images conteneurs, des fichiers IaC, des dépôts Git, Kubernetes et des fichiers de configuration. Il prend en charge le scan de configurations Terraform pour détecter des erreurs de configuration.

## Prérequis

- Terraform installé
- Trivy installé
- Docker optionnel (pour le déploiement final)

```bash
terraform version
trivy --version
```

## Installation de Trivy

Sous macOS avec Homebrew :

```bash
brew install trivy
```

Sous Linux :

```bash
curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sudo sh -s -- -b /usr/local/bin
```

Sous Windows avec Chocolatey :

```powershell
choco install trivy
```

## Arborescence

```
tp-terraform-trivy/
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
tfplan.binary
tfplan.json
trivy-report.json
```

## Fichier `variables.tf`

```hcl
variable "container_name" {
  description = "Nom du conteneur"
  type        = string
  default     = "tp-security-nginx"
}

variable "external_port" {
  description = "Port exposé"
  type        = number
  default     = 8080
}
```

## Fichier `main.tf`

> Ce fichier contient volontairement des problèmes de sécurité pour générer des alertes Trivy.

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
  name = "nginx:latest"
}

resource "docker_container" "web" {
  name  = var.container_name
  image = docker_image.nginx.image_id

  privileged = true

  ports {
    internal = 80
    external = var.external_port
  }

  env = [
    "ADMIN_PASSWORD=password123"
  ]
}
```

## Fichier `outputs.tf`

```hcl
output "application_url" {
  description = "URL locale de l'application"
  value       = "http://localhost:${var.external_port}"
}
```

## Étape 1 : vérifier le code Terraform

```bash
terraform init
terraform fmt
terraform validate
terraform plan
```

Une configuration peut être valide pour Terraform, mais mauvaise du point de vue sécurité. Trivy sert justement à détecter ce type de problème.

## Étape 2 : scanner le code Terraform avec Trivy

```bash
trivy config .
```

Trivy recherche récursivement les fichiers Terraform dans le dossier et évalue les variables, imports et autres éléments pour détecter des erreurs de configuration.

## Étape 3 : lire les résultats

Observer dans la sortie les champs suivants pour chaque alerte :

- **Type** : `Terraform Security Check`
- **Severity** : niveau de risque (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- **File** : fichier concerné (`main.tf`)
- **Resource** : ressource Terraform en cause
- **Rule** : identifiant de la règle déclenchée (ex. `AVD-DKR-0001`)
- **Recommendation** : action corrective proposée

## Étape 4 : afficher seulement les alertes importantes

```bash
trivy config --severity HIGH,CRITICAL .
```

## Étape 5 : corriger le mode privilégié

Dans `main.tf`, remplacer :

```hcl
privileged = true
```

par :

```hcl
privileged = false
```

Relancer :

```bash
trivy config .
```

L'alerte sur le mode privilégié doit disparaître.

## Étape 6 : comprendre et traiter le secret en clair

Le secret `ADMIN_PASSWORD=password123` est en clair dans la configuration -- Trivy le détecte via le nom de la clé.

Sortir la valeur du code source en utilisant une variable Terraform sensible.

Dans `variables.tf`, ajouter :

```hcl
variable "admin_password" {
  description = "Mot de passe administrateur"
  type        = string
  sensitive   = true
}
```

Dans `main.tf`, remplacer :

```hcl
env = [
  "ADMIN_PASSWORD=password123"
]
```

par :

```hcl
env = [
  "ADMIN_PASSWORD=${var.admin_password}"
]
```

Fournir la valeur via variable d'environnement :

Sous Linux ou macOS :

```bash
export TF_VAR_admin_password="ChangerMoi123!"
```

Sous PowerShell :

```powershell
$env:TF_VAR_admin_password="ChangerMoi123!"
```

```bash
terraform plan
trivy config .
```

> **Note** : Trivy peut continuer à signaler une alerte sur `ADMIN_PASSWORD` même après cette correction, car le nom de la variable d'environnement reste un indicateur de secret potentiel indépendamment de sa valeur. C'est un comportement attendu.
>
> La vraie solution en production est de ne pas injecter de secrets via des variables d'environnement Docker du tout, mais de les récupérer à l'exécution depuis un gestionnaire de secrets comme HashiCorp Vault, AWS Secrets Manager ou Azure Key Vault.

## Étape 7 : scanner avec un fichier `.tfvars`

Créer un fichier `dev.tfvars` :

```hcl
container_name = "tp-security-dev"
external_port  = 8081
```

```bash
trivy config --tf-vars dev.tfvars .
```

> Trivy prend en compte les valeurs du fichier `.tfvars` pour évaluer les règles qui dépendent des valeurs de variables.

## Étape 8 : scanner un plan Terraform

Générer un plan binaire :

```bash
terraform plan -out tfplan.binary
```

Convertir en JSON :

```bash
terraform show -json tfplan.binary > tfplan.json
```

Scanner le plan JSON :

```bash
trivy config tfplan.json
```

> Scanner le plan permet à Trivy d'évaluer les valeurs effectives des variables après résolution, et non uniquement les valeurs par défaut. C'est plus précis pour détecter des configurations risquées dans un contexte d'exécution réel.

## Étape 9 : générer une sortie JSON

```bash
trivy config --format json --output trivy-report.json .
```

Utile pour une pipeline CI/CD ou pour archiver et comparer les résultats entre deux scans.

## Étape 10 : faire échouer la commande si une alerte critique existe

```bash
trivy config --severity CRITICAL --exit-code 1 .
```

> Avec `--exit-code 1`, Trivy retourne un code de sortie non nul si des alertes correspondant au filtre sont trouvées. C'est le mécanisme utilisé pour bloquer une pipeline CI/CD en cas de problème détecté.

## Étape 11 : ignorer une règle avec justification

Créer un fichier `.trivyignore` avec l'identifiant exact de la règle (visible dans la sortie de `trivy config .`) :

```
# Justification : secret injecté via TF_VAR, valeur non exposée dans le code source
AVD-DKR-0001
```

```bash
trivy config .
```

> A utiliser uniquement si la règle n'est pas applicable dans le contexte du TP, avec une justification documentée. En production, chaque règle ignorée doit faire l'objet d'une décision tracée.

## Étape 12 : script local de validation

Créer un fichier `scan.sh` :

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

echo "==> Scan de sécurité IaC avec Trivy..."
trivy config --severity HIGH,CRITICAL --exit-code 1 .

echo "==> Toutes les vérifications sont passées."
```

```bash
chmod +x scan.sh
./scan.sh
```

## Variante GitLab CI

```yaml
stages:
  - validate
  - security

terraform_validate:
  image: hashicorp/terraform:latest
  stage: validate
  script:
    - terraform init
    - terraform fmt -check
    - terraform validate

trivy_iac_scan:
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  stage: security
  script:
    - trivy config --severity HIGH,CRITICAL --exit-code 1 .
```

## Variante GitHub Actions

```yaml
name: Terraform Security

on:
  pull_request:
  push:

jobs:
  trivy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy IaC scan
        uses: aquasecurity/trivy-action@0.20.0
        with:
          scan-type: config
          scan-ref: .
          severity: HIGH,CRITICAL
          exit-code: "1"
```

> La version `@0.20.0` est épinglée explicitement. Utiliser `@master` dans une pipeline de sécurité est une mauvaise pratique -- le contenu du tag peut changer sans avertissement. Vérifier la dernière version stable sur [github.com/aquasecurity/trivy-action](https://github.com/aquasecurity/trivy-action/releases).

## Nettoyage

```bash
terraform destroy
rm -f tfplan.binary tfplan.json trivy-report.json
```
