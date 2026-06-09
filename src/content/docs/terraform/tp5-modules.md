---
title: "TP 5 : Les modules Terraform"
description: Créer et utiliser des modules réutilisables dans Terraform.
---

## Objectif

Créer et utiliser des modules Terraform réutilisables.

Ce TP permet de voir comment :

- structurer un projet Terraform avec des modules
- définir les fichiers `main.tf`, `variables.tf` et `outputs.tf` d'un module
- appeler un module depuis un projet parent
- passer des variables et récupérer des outputs de module

## Prérequis

- Terraform installé
- LocalStack installé et lancé (pour simuler AWS localement)

```bash
terraform version
docker run --rm -p 4566:4566 localstack/localstack &
```

## Création d'un module Terraform

Créez un dossier pour votre module :

```bash
mkdir -p terraform/modules/instance
cd terraform/modules/instance
```

Ajoutez les fichiers nécessaires :
- `main.tf` : définit les ressources du module.
- `variables.tf` : définit les variables d'entrée.
- `outputs.tf` : définit les valeurs de sortie.

**`main.tf`** (création d'une instance AWS EC2) :

```hcl
resource "aws_instance" "example" {
  ami           = var.ami
  instance_type = var.instance_type
}
```

**`variables.tf`** :

```hcl
variable "ami" {
  description = "ID de l'AMI"
  type        = string
}

variable "instance_type" {
  description = "Type de l'instance"
  type        = string
  default     = "t2.micro"
}
```

**`outputs.tf`** :

```hcl
output "instance_id" {
  description = "ID de l'instance EC2"
  value       = aws_instance.example.id
}
```

## Utilisation du module dans un projet Terraform

Créez un projet Terraform parent :

```bash
cd ../../
mkdir projet-terraform
cd projet-terraform
```

Ajoutez un fichier `main.tf` et appelez le module :

```hcl
provider "aws" {
  region                      = "us-east-2"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    ec2 = "http://localhost:4566"
  }
}

module "instance" {
  source        = "../modules/instance"
  ami           = "ami-12345678"
  instance_type = "t3.micro"
}

output "instance_module" {
  value = module.instance
}
```

Initialisez et appliquez Terraform :

```bash
terraform init
terraform apply -auto-approve
```

Vérifiez les sorties :

```bash
terraform output
```

**Bonus :** Ajoutez d'autres ressources dans votre module, comme un groupe de sécurité ou un volume EBS.

## Nettoyage des ressources

```bash
terraform destroy -auto-approve
rm -rf .terraform terraform.tfstate*
```
