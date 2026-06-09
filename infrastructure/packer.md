---
title: "TP : Créer des AMI avec Packer"
description: Maîtriser la création d'Amazon Machine Images personnalisées et reproductibles avec HashiCorp Packer.
---

# TP AWS Free Tier : Créer des AMI personnalisées avec Packer

## Objectif

Maîtriser la création d'Amazon Machine Images (AMI) personnalisées et reproductibles avec HashiCorp Packer pour automatiser le déploiement d'images préconfigurées.

## Compétences travaillées

- Installation et configuration de Packer
- Écriture de templates Packer HCL2
- Builders AWS pour AMI
- Provisioners (shell, file)
- Variables et gestion de configuration
- Validation de templates
- Build d'images automatisé
- Bonnes pratiques AMI
- Versioning d'images

## Architecture cible

```
Machine locale
    |
    | packer build
    v
Instance EC2 temporaire (t2.micro)
    |
    | Provisioning (shell scripts)
    v
Snapshot EBS
    |
    v
AMI personnalisée
    |
    +-- Tags: Name, Version, ManagedBy
    +-- Stockée dans EC2 > AMIs
```

## Durée estimée

1 heure 30 minutes

## Coût

Compatible Free Tier avec vigilance :

- Instance EC2 t2.micro : Gratuit (750h/mois)
- Stockage AMI : ~0,05 USD/GB/mois après snapshot
- Chaque build consomme 10-15 minutes d'instance

---

## Étape 1 : Installer Packer

### Linux / Mac

```bash
# Ubuntu/Debian
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install packer

# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/packer
```

### Windows

```bash
choco install packer
```

### Vérification

```bash
packer version
# Packer v1.10.x
```

### Configurer les credentials AWS

Packer utilise les mêmes credentials que AWS CLI.

```bash
aws sts get-caller-identity
# Si non configuré :
aws configure
```

---

## Étape 2 : Premier template Packer

Créez un dossier `packer-ami-tp/` et un fichier `ubuntu-base.pkr.hcl` :

```hcl
packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "eu-west-3"
}

variable "instance_type" {
  type    = string
  default = "t2.micro"
}

source "amazon-ebs" "ubuntu" {
  ami_name      = "tp-packer-ubuntu-{{timestamp}}"
  instance_type = var.instance_type
  region        = var.aws_region

  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]  # Canonical (éditeur Ubuntu)
  }

  ssh_username = "ubuntu"

  tags = {
    Name      = "TP Packer Ubuntu Base"
    ManagedBy = "Packer"
    Created   = "{{timestamp}}"
  }
}

build {
  name    = "ubuntu-base"
  sources = ["source.amazon-ebs.ubuntu"]

  provisioner "shell" {
    inline = [
      "echo 'Mise à jour du système'",
      "sudo apt-get update",
      "sudo apt-get upgrade -y",
      "echo 'Installation terminée'"
    ]
  }
}
```

### Initialiser et valider

```bash
packer init ubuntu-base.pkr.hcl
packer validate ubuntu-base.pkr.hcl
# The configuration is valid.

packer fmt ubuntu-base.pkr.hcl   # formate le code
packer inspect ubuntu-base.pkr.hcl
```

---

## Étape 3 : Builder la première AMI

```bash
packer build ubuntu-base.pkr.hcl
```

Le processus prend 10-15 minutes :

1. Prévalidation des paramètres
2. Recherche de l'AMI Ubuntu source
3. Création keypair temporaire
4. Création Security Group temporaire (port 22)
5. Lancement instance t2.micro
6. Attente connexion SSH
7. Exécution des provisioners
8. Arrêt de l'instance
9. Création de l'AMI (snapshot)
10. Nettoyage (instance, SG, keypair)

```
==> Builds finished. The artifacts of successful builds are:
--> amazon-ebs.ubuntu: AMIs were created:
eu-west-3: ami-0abcdef1234567890
```

Vérifiez dans EC2 → AMIs → Owned by me.

---

## Étape 4 : AMI avec LAMP stack

Créez `lamp-stack.pkr.hcl` :

```hcl
packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region"       {
    type = string
    default = "eu-west-3"
}
variable "ami_name_prefix"  {
    type = string
    default = "lamp-stack"
}
variable "app_version"    { type = string
    default = "1.0.0"
}

locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
  ami_name  = "${var.ami_name_prefix}-${var.app_version}-${local.timestamp}"
}

source "amazon-ebs" "lamp" {
  ami_name      = local.ami_name
  instance_type = "t2.micro"
  region        = var.aws_region

  source_ami_filter {
    filters = {
      name                = "ubuntu/images/*ubuntu-jammy-22.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }

  ssh_username = "ubuntu"
  ssh_timeout  = "10m"

  tags = {
    Name      = local.ami_name
    Version   = var.app_version
    Stack     = "LAMP"
    ManagedBy = "Packer"
  }

  snapshot_tags = {
    Name      = "${local.ami_name}-snapshot"
    ManagedBy = "Packer"
  }
}

build {
  name    = "lamp-stack-build"
  sources = ["source.amazon-ebs.lamp"]

  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y"
    ]
  }

  provisioner "shell" {
    inline = [
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y apache2",
      "sudo systemctl enable apache2"
    ]
  }

  provisioner "shell" {
    inline = [
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server",
      "sudo systemctl enable mysql"
    ]
  }

  provisioner "shell" {
    inline = [
      "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y php8.1 php8.1-mysql libapache2-mod-php8.1",
      "sudo a2enmod php8.1 rewrite ssl headers"
    ]
  }

  provisioner "shell" {
    inline = [
      "sudo apt-get install -y git curl wget unzip vim htop",
      "sudo apt-get clean",
      "sudo apt-get autoremove -y"
    ]
  }

  provisioner "shell" {
    inline = [
      "echo 'AMI Name: ${local.ami_name}' | sudo tee /etc/ami-info.txt",
      "echo 'Version: ${var.app_version}' | sudo tee -a /etc/ami-info.txt",
      "apache2 -v | sudo tee -a /etc/ami-info.txt",
      "php -v | sudo tee -a /etc/ami-info.txt"
    ]
  }

  post-processor "manifest" {
    output     = "manifest.json"
    strip_path = true
  }
}
```

### Builder avec version personnalisée

```bash
packer build lamp-stack.pkr.hcl
# ou avec variable
packer build -var 'app_version=2.0.0' lamp-stack.pkr.hcl
```

Durée : ~15-20 minutes.

Le fichier `manifest.json` contient l'AMI ID pour intégration CI/CD.

---

## Étape 5 : Utiliser des scripts externes

### Structure du projet

```
packer-ami-tp/
├── ubuntu-base.pkr.hcl
├── lamp-stack.pkr.hcl
├── lamp-with-app.pkr.hcl
├── scripts/
│   └── install-lamp.sh
└── files/
    └── app/
        └── index.php
```

### scripts/install-lamp.sh

```bash
#!/bin/bash
set -e

echo "=== Installation LAMP Stack ==="

sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    apache2 \
    mysql-server \
    php8.1 \
    php8.1-mysql \
    php8.1-curl \
    php8.1-gd \
    php8.1-mbstring \
    libapache2-mod-php8.1 \
    git curl wget unzip vim htop

sudo systemctl enable apache2 mysql
sudo a2enmod php8.1 rewrite ssl headers

sudo apt-get clean
sudo apt-get autoremove -y

echo "=== Installation terminée ==="
```

```bash
chmod +x scripts/install-lamp.sh
```

### Template avec fichiers externes

```hcl
build {
  sources = ["source.amazon-ebs.lamp-app"]

  # Upload du script
  provisioner "file" {
    source      = "scripts/install-lamp.sh"
    destination = "/tmp/install-lamp.sh"
  }

  # Exécution du script
  provisioner "shell" {
    inline = [
      "chmod +x /tmp/install-lamp.sh",
      "sudo /tmp/install-lamp.sh"
    ]
  }

  # Upload de l'application
  provisioner "file" {
    source      = "files/app/"
    destination = "/tmp/app"
  }

  provisioner "shell" {
    inline = [
      "sudo cp -r /tmp/app/* /var/www/html/",
      "sudo chown -R www-data:www-data /var/www/html/"
    ]
  }

  post-processor "manifest" {
    output = "manifest-app.json"
  }
}
```

---

## Étape 6 : Variables et fichiers de configuration

### variables.pkrvars.hcl

```hcl
aws_region      = "eu-west-3"
app_version     = "2.1.0"
ami_name_prefix = "production-lamp"
```

```bash
packer build -var-file="variables.pkrvars.hcl" lamp-stack.pkr.hcl
```

### Variables d'environnement

```bash
export PKR_VAR_aws_region="us-east-1"
export PKR_VAR_app_version="3.0.0"
packer build lamp-stack.pkr.hcl
```

**Ordre de priorité :**
1. Variables d'environnement `PKR_VAR_*`
2. Fichiers `.pkrvars.hcl`
3. Flags `-var` en ligne de commande
4. Valeurs `default` dans le template

---

## Étape 7 : Bonnes pratiques

```hcl
source "amazon-ebs" "production-lamp" {
  ami_name        = local.ami_name
  ami_description = "AMI LAMP ${var.environment} v${var.app_version}"
  instance_type   = "t2.micro"

  # EBS chiffré
  launch_block_device_mappings {
    device_name           = "/dev/sda1"
    volume_size           = 8
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true
  }

  # Dépréciation automatique après 90 jours
  deprecate_at = timeadd(timestamp(), "2160h")

  tags = {
    Name        = local.ami_name
    Version     = var.app_version
    Environment = var.environment
    ManagedBy   = "Packer"
    BuildDate   = local.timestamp
  }
}
```

---

## Nettoyage

### Lister les AMI créées

```bash
aws ec2 describe-images --owners self --region eu-west-3
```

### Supprimer une AMI

```bash
aws ec2 deregister-image --image-id ami-0abc123def456 --region eu-west-3
```

### Supprimer les snapshots

```bash
aws ec2 describe-snapshots --owner-ids self --region eu-west-3
aws ec2 delete-snapshot --snapshot-id snap-0xyz789 --region eu-west-3
```

---

## Points clés

1. Packer crée des images reproductibles automatiquement
2. Les templates HCL2 sont plus maintenables que JSON
3. Le builder `amazon-ebs` lance une instance temporaire, la provisionne, puis crée l'AMI
4. Provisioners : `shell` (scripts), `file` (upload fichiers)
5. Variables permettent la réutilisation des templates
6. `manifest.json` permet l'intégration CI/CD
7. Deprecation automatique évite l'accumulation d'AMI
8. Toujours taguer les AMI pour l'organisation et le suivi des coûts
