---
title: "TP 2 : Utiliser les outputs"
description: Récupérer et utiliser des informations après un déploiement Terraform avec les outputs.
---

## Objectif

Découvrir les outputs Terraform pour récupérer des informations après un déploiement.

Ce TP permet de voir comment afficher :

- le nom d'une ressource créée
- une URL d'accès
- un port exposé
- une information calculée à partir de variables
- un output sensible masqué

**Niveau** : Débutant : **Environnement** : Docker local

## Prérequis

- Terraform installé
- Docker installé et lancé

```bash
terraform version
docker version
```

## Arborescence

```
tp-terraform-outputs/
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
variable "container_name" {
  description = "Nom du conteneur Docker"
  type        = string
  default     = "tp-outputs-nginx"
}

variable "image_name" {
  description = "Image Docker utilisée"
  type        = string
  default     = "nginx:latest"
}

variable "external_port" {
  description = "Port exposé sur la machine locale"
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
  name  = var.container_name
  image = docker_image.nginx.image_id

  ports {
    internal = 80
    external = var.external_port
  }
}
```

## Fichier `outputs.tf`

```hcl
output "container_name" {
  description = "Nom du conteneur créé"
  value       = docker_container.web.name
}

output "image_name" {
  description = "Image Docker utilisée"
  value       = docker_image.nginx.name
}

output "external_port" {
  description = "Port exposé sur la machine locale"
  value       = var.external_port
}

output "application_url" {
  description = "URL locale de l'application"
  value       = "http://localhost:${var.external_port}"
}

output "container_id" {
  description = "Identifiant du conteneur Docker"
  value       = docker_container.web.id
}
```

## Étape 1 : initialiser Terraform

```bash
terraform init
```

## Étape 2 : vérifier la configuration

```bash
terraform fmt
terraform validate
```

## Étape 3 : afficher le plan

```bash
terraform plan
```

## Étape 4 : créer le conteneur

```bash
terraform apply
```

Confirmer avec `yes`.

À la fin de l'exécution, Terraform affiche automatiquement les outputs définis :

```
Outputs:

application_url = "http://localhost:8080"
container_id    = "xxxxxxxxxxxx"
container_name  = "tp-outputs-nginx"
external_port   = 8080
image_name      = "nginx:latest"
```

## Étape 5 : afficher les outputs manuellement

Afficher tous les outputs :

```bash
terraform output
```

Afficher uniquement l'URL :

```bash
terraform output application_url
```

Afficher uniquement le nom du conteneur :

```bash
terraform output container_name
```

## Étape 6 : tester l'application

```bash
curl http://localhost:8080
```

## Étape 7 : utiliser un output dans un script

```bash
APP_URL=$(terraform output -raw application_url)
echo $APP_URL
curl $APP_URL
```

> L'option `-raw` retourne la valeur sans guillemets, directement utilisable dans un script shell ou une pipeline CI/CD.

## Étape 8 : ajouter un output sans recréer l'infrastructure

Ajouter dans `outputs.tf` :

```hcl
output "docker_command" {
  description = "Commande Docker pour inspecter le conteneur"
  value       = "docker inspect ${docker_container.web.name}"
}
```

Ajouter un output ne modifie aucune ressource :

```bash
terraform apply
```

La sortie indique `Apply complete! Resources: 0 added, 0 changed, 0 destroyed.`

```bash
terraform output docker_command
```

## Étape 9 : output sensible

Ajouter une variable sensible dans `variables.tf` :

```hcl
variable "admin_password" {
  description = "Mot de passe fictif pour démonstration"
  type        = string
  sensitive   = true
}
```

Fournir la valeur via variable d'environnement -- ne jamais la mettre en `default` :

Sous Linux ou macOS :

```bash
export TF_VAR_admin_password="password123"
```

Sous PowerShell :

```powershell
$env:TF_VAR_admin_password="password123"
```

Ajouter dans `outputs.tf` :

```hcl
output "admin_password" {
  description = "Exemple d'output sensible"
  value       = var.admin_password
  sensitive   = true
}
```

```bash
terraform apply
```

Terraform masque la valeur dans tous les affichages :

```
admin_password = <sensitive>
```

Pour afficher la valeur explicitement :

```bash
terraform output admin_password
```

> **Attention** : `terraform output <nom>` affiche la valeur en clair dans le terminal, y compris dans l'historique de commandes.

> `sensitive = true` masque la valeur dans les logs Terraform, mais **ne chiffre pas** la valeur dans le fichier de state. Ne jamais stocker de secrets réels dans le state sans backend chiffré.

## Étape 10 : nettoyage

```bash
terraform destroy
```

## Points importants

Les outputs servent à afficher des informations utiles après un déploiement : URL, identifiant, adresse IP, nom de ressource, commande à utiliser ensuite.

Ils peuvent être consommés par d'autres outils -- script shell, pipeline CI/CD, ou autre projet Terraform via `terraform_remote_state`.

`sensitive = true` masque une valeur dans les affichages Terraform, mais ne la protège pas dans le state. Pour les secrets de production, utiliser un gestionnaire de secrets comme HashiCorp Vault ou AWS Secrets Manager.

## Variante sans Docker

Pour un TP sans Docker, utiliser le provider `local` natif -- aucune installation supplémentaire nécessaire :

```hcl
terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

resource "local_file" "example" {
  filename = "message.txt"
  content  = "Fichier créé avec Terraform"
}

output "file_path" {
  description = "Chemin du fichier créé"
  value       = local_file.example.filename
}

output "file_content" {
  description = "Contenu du fichier créé"
  value       = local_file.example.content
}
```
