---
title: "TP : Estimation FinOps avec Infracost"
date: 2026-05-28
description: Estimer le coût prévisionnel d'une infrastructure AWS décrite en Terraform avant tout déploiement, analyser les ressources coûteuses et mesurer l'impact d'optimisations FinOps.
---

## Outils

Terraform, Infracost, AWS CLI

## Objectif

Ce TP permet d'estimer le coût prévisionnel d'une infrastructure AWS décrite en Terraform, avant toute création de ressource.

L'apprenant va :

1. créer un projet Terraform ;
2. décrire plusieurs ressources AWS dans le code ;
3. générer un plan Terraform ;
4. analyser le coût prévisionnel avec Infracost ;
5. comparer plusieurs variantes d'architecture ;
6. identifier les ressources qui portent le coût ;
7. appliquer des optimisations ;
8. mesurer l'écart entre la version initiale et la version optimisée ;
9. nettoyer les fichiers générés.

Infracost permet d'obtenir des estimations de coûts pour Terraform avant déploiement.

## Sources

| Sujet | Source |
|---|---|
| Infracost | https://www.infracost.io/docs/ |
| Commandes Infracost | https://www.infracost.io/docs/features/cli_commands/ |
| Terraform | https://developer.hashicorp.com/terraform |
| Fournisseur AWS Terraform | https://registry.terraform.io/providers/hashicorp/aws/latest/docs |
| Tarification AWS | https://aws.amazon.com/pricing/ |

## Durée indicative

| Séquence | Durée |
|---|---:|
| Préparation locale | 15 min |
| Installation des outils | 20 min |
| Création du projet Terraform | 35 min |
| Première estimation Infracost | 30 min |
| Analyse détaillée des coûts | 30 min |
| Optimisation de l'infrastructure | 40 min |
| Comparaison avant et après | 30 min |
| Nettoyage | 10 min |
| Total | 3 h 30 |

## Compétences travaillées

| Compétence | Niveau attendu |
|---|---|
| Lire une configuration Terraform | Débutant à intermédiaire |
| Générer un plan Terraform | Intermédiaire |
| Comprendre une estimation de coût cloud | Intermédiaire |
| Utiliser Infracost | Intermédiaire |
| Identifier les ressources coûteuses | Intermédiaire |
| Comparer deux variantes d'infrastructure | Intermédiaire |
| Proposer des optimisations FinOps | Intermédiaire |

## Scénario

Une équipe prépare une infrastructure AWS pour une petite application interne.

Avant tout déploiement, elle souhaite estimer le coût prévisionnel de l'architecture.

Le premier modèle Terraform contient volontairement plusieurs choix discutables :

```text
instance EC2 surdimensionnée
volume EBS trop grand
bucket S3 sans hypothèse de volume explicite
base RDS déclarée dans le code
absence de tags de pilotage financier
```

L'objectif est d'utiliser Infracost pour comprendre l'impact financier de ces choix, puis de proposer une version plus raisonnable.

**Le TP se concentre sur l'analyse du code et du plan Terraform. Les ressources ne sont pas créées. Ce TP ne génère aucun coût AWS.**

## Logique du TP

| Étape | Objectif |
|---|---|
| Préparer l'environnement | Installer Terraform et Infracost |
| Créer un projet Terraform | Décrire une infrastructure AWS |
| Générer un plan | Produire une base d'analyse |
| Exécuter Infracost | Obtenir une estimation mensuelle |
| Lire le détail des coûts | Identifier les ressources principales |
| Modifier l'architecture | Réduire le coût prévisionnel |
| Comparer les versions | Mesurer l'écart |
| Construire une synthèse | Formaliser les leviers FinOps |
| Nettoyer | Supprimer les fichiers temporaires |

---

## 1. Préparation de l'environnement

### 1.1. Créer le répertoire de travail

```bash
mkdir -p tp-finops-infracost
cd tp-finops-infracost
mkdir -p terraform rapports/infracost notes
```

### 1.2. Créer un `.gitignore`

> Les plans Terraform peuvent contenir des valeurs sensibles résolues (credentials, mots de passe de variables). Ne jamais les versionner.

```bash
cat > .gitignore <<'EOF'
.terraform/
.terraform.lock.hcl
tfplan
tfplan.json
tfplan-optimise
tfplan-optimise.json
tfplan-sans-rds
tfplan-sans-rds.json
rapports/
notes/
EOF
```

### 1.3. Vérifier AWS CLI et l'identité

```bash
aws --version
aws sts get-caller-identity --profile default
```

Exemple de sortie attendue :

```json
{
  "UserId": "AIDAEXAMPLE",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/admin-sandbox"
}
```

### 1.4. Définir les variables du TP

```bash
PROFIL_AWS="default"
REGION_AWS="eu-west-1"
echo "$PROFIL_AWS"
echo "$REGION_AWS"
```

---

## 2. Installation des outils

### 2.1. Installer Terraform

**macOS :**

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

**Linux (binaire officiel HashiCorp) :**

```bash
TERRAFORM_VERSION=$(curl -s https://api.github.com/repos/hashicorp/terraform/releases/latest \
  | grep tag_name | cut -d '"' -f4 | sed 's/v//')
curl -sSL "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" \
  -o terraform_linux.zip
unzip terraform_linux.zip -d /usr/local/bin/
rm terraform_linux.zip
```

Vérifier :

```bash
terraform version
```

### 2.2. Installer Infracost

**macOS :**

```bash
brew install infracost
```

**Linux :**

```bash
curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh
```

Vérifier :

```bash
infracost --version
```

### 2.3. Configurer Infracost

Infracost est gratuit pour usage individuel et nécessite une clé API.

**Option 1 — avec navigateur (macOS, Linux desktop) :**

```bash
infracost auth login
```

Cette commande ouvre un navigateur pour créer ou connecter un compte sur infracost.io.

**Option 2 — sans navigateur (WSL, VM headless) :**

Créer un compte sur https://www.infracost.io, récupérer la clé API dans les paramètres du compte, puis la configurer manuellement :

```bash
infracost configure set api_key <VOTRE_CLE_API>
```

Vérifier la configuration :

```bash
infracost configure get api_key
infracost doctor
```

---

## 3. Création du projet Terraform initial

### 3.1. Créer le fichier provider

```bash
cat > terraform/provider.tf <<'EOF'
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
EOF
```

### 3.2. Créer le fichier de variables

```bash
cat > terraform/variables.tf <<'EOF'
variable "aws_region" {
  description = "Région AWS utilisée"
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Nom du projet"
  type        = string
  default     = "finops-lab"
}

variable "environment" {
  description = "Environnement"
  type        = string
  default     = "lab"
}

variable "bucket_suffix" {
  description = "Suffixe unique pour le bucket"
  type        = string
  default     = "123456"
}

variable "db_password" {
  description = "Mot de passe de la base RDS"
  type        = string
  sensitive   = true
  default     = "ChangeMe123456789!"
}
EOF
```

> **Bonne pratique** : le mot de passe de la base de données est déclaré comme variable `sensitive` plutôt qu'écrit en dur dans le code. En production, ce mot de passe doit provenir d'un gestionnaire de secrets (AWS Secrets Manager, Vault) et jamais d'une valeur par défaut dans le code. Pour ce TP, la valeur par défaut est acceptable car aucune ressource n'est créée.

### 3.3. Créer une instance EC2 volontairement surdimensionnée

> **Note sur `data "aws_ami"`** : ce bloc contacte l'API AWS pour résoudre l'AMI la plus récente. Il nécessite des credentials AWS valides lors de `terraform plan`. Si les credentials ne sont pas disponibles, remplacer la référence `data.aws_ami.amazon_linux.id` par un AMI fictif en dur (ex. `"ami-00000000000000000"`) pour que le plan aboutisse — Infracost n'a pas besoin d'un AMI réel pour estimer le coût.

```bash
cat > terraform/ec2.tf <<'EOF'
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "application" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.large"

  root_block_device {
    volume_size = 100
    volume_type = "gp3"
  }

  tags = {
    Name        = "${var.project_name}-application"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
EOF
```

### 3.4. Créer un bucket S3

```bash
cat > terraform/s3.tf <<'EOF'
resource "aws_s3_bucket" "data" {
  bucket = "${var.project_name}-data-${var.bucket_suffix}"

  tags = {
    Name        = "${var.project_name}-data"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
EOF
```

### 3.5. Créer une base RDS volontairement trop ambitieuse

```bash
cat > terraform/rds.tf <<'EOF'
resource "aws_db_instance" "database" {
  identifier              = "${var.project_name}-database"
  engine                  = "postgres"
  engine_version          = "16"
  instance_class          = "db.t3.medium"
  allocated_storage       = 100
  storage_type            = "gp3"
  backup_retention_period = 7
  skip_final_snapshot     = true

  username = "appuser"
  password = var.db_password

  tags = {
    Name        = "${var.project_name}-database"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
EOF
```

### 3.6. Créer le fichier de sorties

```bash
cat > terraform/outputs.tf <<'EOF'
output "ec2_instance_type" {
  value = aws_instance.application.instance_type
}

output "bucket_name" {
  value = aws_s3_bucket.data.bucket
}

output "rds_instance_class" {
  value = aws_db_instance.database.instance_class
}
EOF
```

---

## 4. Validation Terraform

> **Rappel** : `terraform plan` ne crée aucune ressource AWS. Seul `terraform apply` déploie. Ne pas exécuter `terraform apply` dans ce TP.

```bash
cd terraform
terraform fmt -recursive
terraform init
terraform validate
terraform plan -out=tfplan
terraform show -json tfplan > tfplan.json
cd ..
```

---

## 5. Première estimation avec Infracost

Infracost peut analyser soit un dossier HCL directement (il génère son propre plan en interne, ce qui nécessite des credentials AWS si le code contient des `data sources`), soit un plan JSON déjà généré. Utiliser le plan JSON produit à l'étape précédente est plus robuste.

### 5.1. Exécuter Infracost sur le plan JSON

```bash
infracost breakdown \
  --path terraform/tfplan.json \
  --format table \
  --out-file rapports/infracost/estimation-initiale.txt

cat rapports/infracost/estimation-initiale.txt
```

### 5.2. Générer un rapport JSON (nécessaire pour la comparaison)

```bash
infracost breakdown \
  --path terraform/tfplan.json \
  --format json \
  --out-file rapports/infracost/estimation-initiale.json
```

---

## 6. Analyse de l'estimation initiale

### 6.1. Identifier les principaux postes de coût

| Ressource | Choix initial | Impact attendu |
|---|---|---|
| EC2 | `t3.large` | Coût mensuel notable pour une application de test |
| EBS racine | 100 Go gp3 | Coût de stockage inutilement élevé |
| RDS | `db.t3.medium` | Coût mensuel important pour un lab |
| Stockage RDS | 100 Go gp3 | Coût de stockage notable |
| Sauvegardes RDS | 7 jours | Coût indirect possible |
| S3 | Bucket seul | Coût faible sans volume d'objets |

### 6.2. Créer une synthèse initiale

```bash
cat > notes/analyse-initiale.md <<'EOF'
# Analyse initiale Infracost

## Ressources analysées

Instance EC2, bucket S3, base RDS.

## Points d'attention

- Instance EC2 surdimensionnée pour un usage de démonstration
- Volume racine EC2 trop important
- Base RDS représente le poste de coût le plus significatif
- Stockage RDS élevé pour un environnement de test
- Bucket S3 seul a peu d'impact sans données

## Première conclusion

La configuration est techniquement valide mais non optimisée pour un environnement de test.
EOF

cat notes/analyse-initiale.md
```

---

## 7. Création d'une version optimisée

### 7.1. Optimiser l'instance EC2

```bash
cat > terraform/ec2.tf <<'EOF'
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "application" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  root_block_device {
    volume_size = 8
    volume_type = "gp3"
  }

  tags = {
    Name        = "${var.project_name}-application"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    CostCenter  = "training"
  }
}
EOF
```

### 7.2. Optimiser la base RDS

```bash
cat > terraform/rds.tf <<'EOF'
resource "aws_db_instance" "database" {
  identifier              = "${var.project_name}-database"
  engine                  = "postgres"
  engine_version          = "16"
  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  storage_type            = "gp3"
  backup_retention_period = 1
  skip_final_snapshot     = true

  username = "appuser"
  password = var.db_password

  tags = {
    Name        = "${var.project_name}-database"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    CostCenter  = "training"
  }
}
EOF
```

### 7.3. Améliorer les balises S3

```bash
cat > terraform/s3.tf <<'EOF'
resource "aws_s3_bucket" "data" {
  bucket = "${var.project_name}-data-${var.bucket_suffix}"

  tags = {
    Name        = "${var.project_name}-data"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    CostCenter  = "training"
    Owner       = "cloud-team"
  }
}
EOF
```

---

## 8. Génération du plan optimisé

```bash
cd terraform
terraform fmt -recursive
terraform validate
terraform plan -out=tfplan-optimise
terraform show -json tfplan-optimise > tfplan-optimise.json
cd ..
```

---

## 9. Estimation de la version optimisée

```bash
infracost breakdown \
  --path terraform/tfplan-optimise.json \
  --format table \
  --out-file rapports/infracost/estimation-optimisee.txt

cat rapports/infracost/estimation-optimisee.txt

infracost breakdown \
  --path terraform/tfplan-optimise.json \
  --format json \
  --out-file rapports/infracost/estimation-optimisee.json
```

---

## 10. Comparaison avant et après

### 10.1. Générer la comparaison Infracost

La commande `infracost diff` compare un plan courant avec un rapport JSON de référence via `--compare-to` :

```bash
infracost diff \
  --path terraform/tfplan-optimise.json \
  --compare-to rapports/infracost/estimation-initiale.json \
  --format table \
  --out-file rapports/infracost/diff-infracost.txt

cat rapports/infracost/diff-infracost.txt
```

### 10.2. Comparaison JSON brute

```bash
diff -u \
  rapports/infracost/estimation-initiale.json \
  rapports/infracost/estimation-optimisee.json \
  > rapports/infracost/diff-json.txt || true

cat rapports/infracost/diff-json.txt
```

### 10.3. Analyse attendue

| Ressource | Avant optimisation | Après optimisation | Effet attendu |
|---|---|---|---|
| EC2 | `t3.large` | `t3.micro` | Baisse du coût calculé |
| Volume EC2 | 100 Go | 8 Go | Baisse du stockage |
| RDS | `db.t3.medium` | `db.t3.micro` | Baisse du coût calculé |
| Stockage RDS | 100 Go | 20 Go | Baisse du stockage |
| Sauvegarde RDS | 7 jours | 1 jour | Réduction de la rétention |
| Tags | Partiels | Plus complets | Meilleure gouvernance |

---

## 11. Variante : suppression de RDS pour un environnement de test

### 11.1. Désactiver la ressource RDS

Déplacer le fichier RDS hors du dossier Terraform pour l'exclure complètement :

```bash
mv terraform/rds.tf terraform/rds.tf.bak
```

> Terraform ne traite que les fichiers `.tf`. L'extension `.bak` exclut le fichier de l'analyse sans le supprimer.

### 11.2. Corriger les sorties Terraform

```bash
cat > terraform/outputs.tf <<'EOF'
output "ec2_instance_type" {
  value = aws_instance.application.instance_type
}

output "bucket_name" {
  value = aws_s3_bucket.data.bucket
}
EOF
```

### 11.3. Générer le plan et estimer sans RDS

```bash
cd terraform
terraform fmt -recursive
terraform validate
terraform plan -out=tfplan-sans-rds
terraform show -json tfplan-sans-rds > tfplan-sans-rds.json
cd ..

infracost breakdown \
  --path terraform/tfplan-sans-rds.json \
  --format table \
  --out-file rapports/infracost/estimation-sans-rds.txt

cat rapports/infracost/estimation-sans-rds.txt
```

### 11.4. Comparer avec la version optimisée

```bash
infracost diff \
  --path terraform/tfplan-sans-rds.json \
  --compare-to rapports/infracost/estimation-optimisee.json \
  --format table \
  --out-file rapports/infracost/diff-sans-rds.txt

cat rapports/infracost/diff-sans-rds.txt
```

La suppression de RDS réduit fortement le coût prévisionnel. Pour un environnement de test, une base managée peut être remplacée par une approche plus simple selon le besoin réel.

### 11.5. Restaurer le fichier RDS pour la cohérence

```bash
mv terraform/rds.tf.bak terraform/rds.tf

cat > terraform/outputs.tf <<'EOF'
output "ec2_instance_type" {
  value = aws_instance.application.instance_type
}

output "bucket_name" {
  value = aws_s3_bucket.data.bucket
}

output "rds_instance_class" {
  value = aws_db_instance.database.instance_class
}
EOF
```

---

## 12. Analyse FinOps

### 12.1. Créer une synthèse FinOps

```bash
cat > notes/synthese-finops.md <<'EOF'
# Synthèse FinOps

## Objectif

Identifier le coût prévisionnel d'une infrastructure décrite en Terraform avant création des ressources.

## Constats principaux

La version initiale contient plusieurs choix coûteux pour un environnement de test :
- instance EC2 surdimensionnée
- volume EBS trop grand
- base RDS trop importante
- stockage RDS élevé
- rétention de sauvegarde plus longue que nécessaire
- balises de gouvernance incomplètes

## Optimisations appliquées

- réduction du type d'instance EC2
- réduction de la taille du volume racine
- réduction du type d'instance RDS
- réduction du stockage RDS
- réduction de la rétention des sauvegardes
- amélioration des tags de gouvernance

## Variante étudiée

Une variante sans RDS a mesuré l'impact d'un service managé sur le coût prévisionnel.

## Enseignement principal

Infracost rend visibles les impacts financiers d'un choix d'architecture avant déploiement.
L'analyse doit être intégrée tôt dans le cycle de développement.
EOF

cat notes/synthese-finops.md
```

### 12.2. Axes d'optimisation à retenir

| Axe FinOps | Exemple dans le TP |
|---|---|
| Dimensionnement | Passer de `t3.large` à `t3.micro` |
| Stockage | Réduire les volumes EBS et RDS |
| Services managés | Questionner l'usage de RDS pour un lab |
| Rétention | Adapter la durée des sauvegardes |
| Balises | Ajouter `CostCenter`, `Owner`, `Environment` |
| Analyse avant déploiement | Utiliser Infracost sur le plan Terraform |

---

## 13. Nettoyage

```bash
# Plans Terraform
rm -f terraform/tfplan terraform/tfplan.json
rm -f terraform/tfplan-optimise terraform/tfplan-optimise.json
rm -f terraform/tfplan-sans-rds terraform/tfplan-sans-rds.json

# Provider téléchargé par terraform init
rm -rf terraform/.terraform terraform/.terraform.lock.hcl

# Rapports et notes
rm -rf rapports notes

# Répertoire du TP
cd ..
rm -rf tp-finops-infracost
```

---

## 14. Repères formateur

### 14.1. Ce TP ne génère aucun coût

Infracost est gratuit pour usage individuel (clé API sur infracost.io). `terraform plan` ne crée aucune ressource. L'appel `ec2:DescribeImages` du `data "aws_ami"` est gratuit. Aucune ressource AWS n'est déployée — seule l'estimation est calculée localement.

### 14.2. Résultat attendu

Les principaux postes de coût attendus dans l'estimation initiale :

```text
EC2 (instance + EBS)
RDS (instance + stockage)
S3 (négligeable sans volume)
```

### 14.3. Analyse attendue

Les choix techniques à fort impact financier :

```text
type d'instance
taille du stockage
service managé vs solution plus légère
durée de rétention
tags de gouvernance
```

### 14.4. Remédiation attendue

La version optimisée réduit la taille de l'instance EC2, du volume EBS, de l'instance RDS, du stockage RDS et de la durée de rétention. Elle améliore les tags et la lisibilité du coût.

### 14.5. Synthèse attendue

Le FinOps commence avant le déploiement. Infracost déplace la discussion coût dans le cycle d'ingénierie — avant le merge, avant le déploiement, avant l'apparition de la facture. L'objectif n'est pas seulement de réduire les coûts, mais de les rendre visibles, explicables et discutables.
