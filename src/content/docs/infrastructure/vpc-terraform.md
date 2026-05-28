---
title: "[TP] Créer un VPC avec Terraform"
date: 2026-05-28
description: Déployer un VPC AWS avec sous-réseaux public et privé, Bastion Host et instance NAT via Terraform.
---

## Objectifs

- **Créer un VPC AWS** avec Terraform.
- **Déployer un réseau public et privé**.
- **Configurer un Bastion Host pour l'accès SSH**.

---

## Architecture AWS du TP

Topologie réseau :

- Un VPC principal avec Internet Gateway
- Sous-réseau public avec Bastion Host pour l'accès SSH
- Sous-réseau privé avec instance NAT et instance EC2 privée
- Routage sécurisé entre les segments réseau

---

## Structure du projet

```
terraform-aws-vpc/
│── provider.tf        # Configuration du provider AWS
│── variables.tf       # Définition des variables Terraform
│── vpc.tf             # Définition du VPC et des sous-réseaux
│── igw.tf             # Configuration de l'internet Gateway
│── nat.tf             # Déploiement d'une instance NAT
│── bastion.tf         # Déploiement du bastion Host
│── instance.tf        # Déploiement d'une instance privée
│── outputs.tf         # Définition des outputs Terraform
│── terraform.tfvars   # Valeurs des variables (à créer)
```

---

## Configurer le provider AWS

**Fichier : `provider.tf`**

```hcl
provider "aws" {
  region = var.aws_region
}
```

---

## Définition des variables

**Fichier : `variables.tf`**

```hcl
variable "aws_region" {
  description = "Région AWS"
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "Plage CIDR du VPC"
  default     = "10.0.0.0/16"
}

variable "subnet_public_cidr" {
  description = "Plage CIDR du sous-réseau public"
  default     = "10.0.1.0/24"
}

variable "subnet_private_cidr" {
  description = "Plage CIDR du sous-réseau privé"
  default     = "10.0.2.0/24"
}

variable "instance_type" {
  description = "Type d'instance EC2 (Gratuit avec Free Tier)"
  default     = "t2.micro"
}
```

---

## Déployer le VPC

**Fichier : `vpc.tf`**

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "Main-VPC"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.subnet_public_cidr
  map_public_ip_on_launch = true

  tags = {
    Name = "Public-Subnet"
  }
}

resource "aws_subnet" "private" {
  vpc_id     = aws_vpc.main.id
  cidr_block = var.subnet_private_cidr

  tags = {
    Name = "Private-Subnet"
  }
}
```

---

## Ajouter une passerelle Internet

**Fichier : `igw.tf`**

```hcl
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "Internet-Gateway"
  }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "Public-Route-Table"
  }
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public_rt.id
}
```

---

## Configurer une instance NAT

**Fichier : `nat.tf`**

```hcl
resource "aws_instance" "nat_instance" {
  ami                         = "ami-0c55b159cbfafe1f0"
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  associate_public_ip_address = true

  tags = {
    Name = "NAT-Instance"
  }
}

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block  = "0.0.0.0/0"
    instance_id = aws_instance.nat_instance.id
  }

  tags = {
    Name = "Private-Route-Table"
  }
}

resource "aws_route_table_association" "private_assoc" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private_rt.id
}
```

---

## Ajouter un Bastion Host

**Fichier : `bastion.tf`**

```hcl
resource "aws_instance" "bastion" {
  ami                         = "ami-0c55b159cbfafe1f0"
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  associate_public_ip_address = true

  tags = {
    Name = "Bastion-Host"
  }
}
```

---

## Déployer une instance privée

**Fichier : `instance.tf`**

```hcl
resource "aws_instance" "private_instance" {
  ami             = "ami-0c55b159cbfafe1f0"
  instance_type   = var.instance_type
  subnet_id       = aws_subnet.private.id
  key_name        = "my-key"
  security_groups = [aws_security_group.default.id]

  tags = {
    Name = "Private-Instance"
  }
}
```

---

## Appliquer Terraform

```bash
terraform init
terraform plan
terraform apply
```

---

## Connexion SSH

```bash
terraform output bastion_ip
ssh -i ~/.ssh/id_rsa ec2-user@<BASTION_IP>
```

---

## Détruire l'infrastructure

```bash
terraform destroy
```
