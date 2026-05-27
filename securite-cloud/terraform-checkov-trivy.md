---
title: "TP : Infrastructure as Code sécurisée avec Terraform, Checkov et Trivy"
description: Auditer du code Terraform avant toute création de ressource AWS avec Checkov et Trivy.
---

# TP : Infrastructure as Code sécurisée avec Terraform, Checkov et Trivy

## Objectif

Auditer du code Terraform avant toute création de ressource AWS.

1. Créer un projet Terraform minimal
2. Écrire une configuration volontairement imparfaite
3. Exécuter les contrôles Terraform de base
4. Analyser le code avec Checkov
5. Analyser le code avec Trivy
6. Comparer les constats des outils
7. Corriger le code Terraform
8. Relancer les analyses
9. Nettoyer les fichiers temporaires

## Sources

| Sujet | Source |
|---|---|
| Terraform | https://developer.hashicorp.com/terraform |
| Checkov | https://www.checkov.io |
| Trivy | https://trivy.dev |
| Fournisseur AWS Terraform | https://registry.terraform.io/providers/hashicorp/aws/latest/docs |
| Bonnes pratiques sécurité S3 | https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html |
| Bonnes pratiques IAM | https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html |

## Durée estimée

| Séquence | Durée |
|---|---:|
| Préparation locale | 15 min |
| Création du projet Terraform | 25 min |
| Validation Terraform | 20 min |
| Analyse avec Checkov | 30 min |
| Analyse avec Trivy | 30 min |
| Correction du code | 40 min |
| Vérification finale | 20 min |
| Nettoyage | 10 min |
| **Total** | **3 h 10** |

## Compétences travaillées

| Compétence | Niveau attendu |
|---|---|
| Lire du code Terraform | Débutant à intermédiaire |
| Comprendre la différence entre syntaxe valide et configuration sécurisée | Intermédiaire |
| Identifier des mauvaises configurations IaC | Intermédiaire |
| Utiliser Checkov | Intermédiaire |
| Utiliser Trivy pour l'analyse IaC | Intermédiaire |
| Corriger une configuration Terraform | Intermédiaire |
| Réduire une politique IAM trop large | Intermédiaire |

## Scénario

Une équipe souhaite créer un bucket S3 et une politique IAM via Terraform.

Avant toute création de ressource, l'équipe sécurité demande une analyse du code Infrastructure as Code.

Le code initial contient plusieurs faiblesses :

```text
bucket S3 sans chiffrement explicite
bucket S3 sans blocage complet de l'accès public
bucket S3 sans versioning
politique IAM trop permissive
absence de balises de gouvernance
```

Le but est d'identifier ces problèmes avant déploiement, puis de corriger le code Terraform.

---

## Étape 1 : Préparation de l'environnement

### 1.1. Créer le répertoire de travail

```bash
mkdir -p tp-terraform-securise
cd tp-terraform-securise
mkdir -p terraform rapports/checkov rapports/trivy
```

### 1.2. Créer un `.gitignore` dès le départ

> **Sécurité** : les fichiers de plan Terraform (`tfplan`, `tfplan.json`) peuvent contenir des valeurs sensibles (secrets, ARN, credentials résolus). Le dossier `.terraform/` contient les binaires des providers. Ces éléments ne doivent pas être versionnés.

```bash
cat > .gitignore <<'EOF'
.terraform/
.terraform.lock.hcl
tfplan
tfplan.json
tfplan-corrected
tfplan-corrected.json
*.tfstate
*.tfstate.backup
rapports/
.venv/
EOF
```

### 1.3. Installer Terraform

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

Vérifier l'installation :

```bash
terraform version
```

### 1.4. Créer un environnement Python et installer Checkov

```bash
python3 -m venv .venv
source .venv/bin/activate       # Linux/macOS
# ou
.\.venv\Scripts\Activate        # Windows PowerShell

python -m pip install --upgrade pip
pip install checkov
checkov --version
```

### 1.5. Installer Trivy

**macOS :**

```bash
brew install trivy
```

**Linux (script officiel) :**

```bash
curl -sSfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh \
  | sh -s -- -b /usr/local/bin
```

Vérifier l'installation :

```bash
trivy --version
```

### 1.6. Vérifier AWS CLI

```bash
aws --version
aws sts get-caller-identity --profile default
```

> **Note** : dans ce TP, les analyses Checkov et Trivy sont purement statiques et ne nécessitent pas de credentials AWS. La commande `terraform init` télécharge le provider AWS (~50 Mo) et fonctionne sans credentials. En revanche, `terraform plan` contacte l'API AWS pour résoudre les ressources — il nécessite des credentials valides. Si le compte AWS n'est pas disponible, cette étape peut être passée ; les analyses statiques restent pleinement fonctionnelles.

---

## Étape 2 : Création du projet Terraform

### 2.1. Créer le fichier provider

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

### 2.2. Créer le fichier de variables

```bash
cat > terraform/variables.tf <<'EOF'
variable "aws_region" {
  description = "Région AWS utilisée pour le TP"
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Nom du projet"
  type        = string
  default     = "iac-security-lab"
}

variable "bucket_suffix" {
  description = "Suffixe unique pour le nom du bucket"
  type        = string
  default     = "123456"
}
EOF
```

### 2.3. Créer une configuration S3 volontairement imparfaite

```bash
cat > terraform/s3.tf <<'EOF'
resource "aws_s3_bucket" "lab_bucket" {
  bucket = "${var.project_name}-demo-bucket-${var.bucket_suffix}"
}

resource "aws_s3_bucket_public_access_block" "lab_bucket_public_access" {
  bucket = aws_s3_bucket.lab_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}
EOF
```

### 2.4. Créer une politique IAM volontairement trop large

```bash
cat > terraform/iam.tf <<'EOF'
resource "aws_iam_policy" "lab_policy" {
  name        = "${var.project_name}-policy"
  description = "Politique IAM de démonstration volontairement trop large"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "TooBroadS3Access"
        Effect   = "Allow"
        Action   = "s3:*"
        Resource = "*"
      }
    ]
  })
}
EOF
```

### 2.5. Créer le fichier de sorties

```bash
cat > terraform/outputs.tf <<'EOF'
output "bucket_name" {
  value = aws_s3_bucket.lab_bucket.bucket
}

output "policy_arn" {
  value = aws_iam_policy.lab_policy.arn
}
EOF
```

---

## Étape 3 : Validation Terraform

### 3.1. Se placer dans le dossier Terraform

```bash
cd terraform
```

### 3.2. Formater le code

```bash
terraform fmt -recursive
```

### 3.3. Initialiser Terraform

```bash
terraform init
```

`terraform init` télécharge le provider AWS. Il ne crée aucune ressource AWS et ne nécessite pas de credentials.

### 3.4. Valider la syntaxe

```bash
terraform validate
```

> **Point clé** : `terraform validate` vérifie uniquement la validité syntaxique et structurelle. Une configuration peut réussir cette validation tout en contenant de graves faiblesses de sécurité. C'est précisément ce que Checkov et Trivy vont révéler ensuite.

### 3.5. Générer un plan Terraform

> **Avertissement** : `terraform plan` analyse le code et affiche ce qui serait créé, mais ne crée rien. Seul `terraform apply` déploie des ressources réelles. Ne pas exécuter `terraform apply` dans ce TP.

```bash
terraform plan -out=tfplan
```

### 3.6. Exporter le plan en JSON

```bash
terraform show -json tfplan > tfplan.json
```

Revenir au dossier parent :

```bash
cd ..
```

---

## Étape 4 : Analyse avec Checkov

> **Note sur la syntaxe `--output-file-path`** : le comportement de cette option varie selon la version de Checkov. Si la commande combinée ci-dessous échoue, utiliser les deux commandes séparées indiquées en commentaire.

### 4.1. Scanner le dossier Terraform

```bash
checkov \
  -d terraform \
  --output cli \
  --output json \
  --output-file-path console,rapports/checkov/checkov-results.json

# Si la commande ci-dessus échoue, exécuter séparément :
# checkov -d terraform --output cli
# checkov -d terraform --output json --output-file-path rapports/checkov/checkov-results.json
```

### 4.2. Afficher le rapport JSON

```bash
cat rapports/checkov/checkov-results.json
```

### 4.3. Scanner le plan Terraform JSON

```bash
checkov \
  -f terraform/tfplan.json \
  --framework terraform_plan \
  --output cli \
  --output json \
  --output-file-path console,rapports/checkov/checkov-plan-results.json

# Si la commande ci-dessus échoue, exécuter séparément :
# checkov -f terraform/tfplan.json --framework terraform_plan --output cli
# checkov -f terraform/tfplan.json --framework terraform_plan --output json \
#   --output-file-path rapports/checkov/checkov-plan-results.json
```

### 4.4. Analyse attendue Checkov

| Constat | Ressource | Risque |
|---|---|---|
| Blocage d'accès public S3 insuffisant | `aws_s3_bucket_public_access_block` | Exposition involontaire |
| Chiffrement S3 absent ou non explicite | `aws_s3_bucket` | Protection insuffisante des données |
| Versioning S3 absent | `aws_s3_bucket` | Restauration plus difficile |
| Politique IAM trop large | `aws_iam_policy` | Surprivilège |
| Action `s3:*` | Politique IAM | Droits trop étendus |
| Ressource `*` | Politique IAM | Périmètre trop large |

Checkov identifie des mauvaises configurations avant déploiement. Une configuration valide pour Terraform peut être non conforme aux bonnes pratiques de sécurité.

---

## Étape 5 : Analyse avec Trivy

### 5.1. Scanner le dossier Terraform

```bash
trivy config terraform \
  --format table \
  --output rapports/trivy/trivy-results.txt

cat rapports/trivy/trivy-results.txt
```

### 5.2. Générer un rapport JSON

```bash
trivy config terraform \
  --format json \
  --output rapports/trivy/trivy-results.json

cat rapports/trivy/trivy-results.json
```

### 5.3. Analyse attendue Trivy

| Constat | Ressource | Risque |
|---|---|---|
| S3 mal protégé | Bucket S3 | Exposition ou protection insuffisante |
| Chiffrement absent | Bucket S3 | Données moins protégées |
| Permissions IAM trop larges | Politique IAM | Surprivilège |
| Ressource globale | Politique IAM | Périmètre trop large |

Les résultats de Trivy peuvent recouper ceux de Checkov sans être strictement identiques. Les différences entre outils sont normales : les règles, la taxonomie et la couverture ne sont pas identiques.

---

## Étape 6 : Correction du code Terraform

### 6.1. Corriger le bucket S3

```bash
cat > terraform/s3.tf <<'EOF'
resource "aws_s3_bucket" "lab_bucket" {
  bucket = "${var.project_name}-demo-bucket-${var.bucket_suffix}"

  tags = {
    Project     = var.project_name
    Environment = "lab"
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "lab_bucket_public_access" {
  bucket = aws_s3_bucket.lab_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "lab_bucket_versioning" {
  bucket = aws_s3_bucket.lab_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "lab_bucket_encryption" {
  bucket = aws_s3_bucket.lab_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
EOF
```

### 6.2. Corriger la politique IAM

> **Note** : la politique corrigée référence `aws_s3_bucket.lab_bucket.arn`, défini dans `s3.tf`. Terraform résout automatiquement cette dépendance inter-fichiers lors du plan. Checkov et Trivy analysent les fichiers séparément et peuvent signaler cette référence comme non résolue dans certaines versions — c'est un comportement attendu.

```bash
cat > terraform/iam.tf <<'EOF'
resource "aws_iam_policy" "lab_policy" {
  name        = "${var.project_name}-policy"
  description = "Politique IAM de démonstration avec permissions limitées"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "LimitedS3ReadAccess"
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.lab_bucket.arn
      },
      {
        Sid    = "LimitedS3ObjectReadAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.lab_bucket.arn}/*"
      }
    ]
  })
}
EOF
```

### 6.3. Reformater, valider et générer le plan corrigé

```bash
cd terraform
terraform fmt -recursive
terraform validate
terraform plan -out=tfplan-corrected
terraform show -json tfplan-corrected > tfplan-corrected.json
cd ..
```

---

## Étape 7 : Vérification après correction

### 7.1. Relancer Checkov sur le code corrigé

```bash
checkov \
  -d terraform \
  --output cli \
  --output json \
  --output-file-path console,rapports/checkov/checkov-results-after-fix.json
```

### 7.2. Relancer Checkov sur le plan corrigé

```bash
checkov \
  -f terraform/tfplan-corrected.json \
  --framework terraform_plan \
  --output cli \
  --output json \
  --output-file-path console,rapports/checkov/checkov-plan-results-after-fix.json
```

### 7.3. Relancer Trivy

```bash
trivy config terraform \
  --format table \
  --output rapports/trivy/trivy-results-after-fix.txt

cat rapports/trivy/trivy-results-after-fix.txt
```

### 7.4. Comparer les résultats

```bash
ls -lh rapports/checkov
ls -lh rapports/trivy
```

| Élément | Avant correction | Après correction |
|---|---|---|
| Accès public S3 | Mal protégé | Bloqué |
| Chiffrement S3 | Absent ou implicite | Explicite |
| Versioning S3 | Absent | Activé |
| Politique IAM | Trop large | Réduite |
| Action `s3:*` | Présente | Supprimée |
| Ressource `*` | Présente | Réduite |

---

## Nettoyage

```bash
# Fichiers de plan
rm -f terraform/tfplan terraform/tfplan.json
rm -f terraform/tfplan-corrected terraform/tfplan-corrected.json

# Provider et lock téléchargés par terraform init
rm -rf terraform/.terraform terraform/.terraform.lock.hcl

# Rapports
rm -rf rapports

# Environnement Python
deactivate
rm -rf .venv
```

---

## Points clés

1. `terraform validate` vérifie la syntaxe, pas la sécurité — une configuration valide peut être non sécurisée
2. Checkov et Trivy analysent statiquement le code IaC sans credentials AWS
3. Les deux outils sont complémentaires : leurs règles et taxonomies diffèrent
4. `terraform plan` ne déploie pas — seul `terraform apply` crée des ressources
5. Toute politique IAM doit reposer sur le principe du moindre privilège
6. Les ressources S3 doivent être durcies explicitement : blocage accès public, chiffrement, versioning
7. Les analyses IaC doivent s'intégrer en amont du pipeline CI/CD, avant tout déploiement

---

## Repères formateur

### Résultat attendu avec Terraform

`terraform validate` doit réussir. Cela confirme que le code est valide pour Terraform, mais ne dit rien sur sa sécurité.

### Résultat attendu avec Checkov

Checkov doit identifier plusieurs mauvaises configurations, notamment :

```text
blocage d'accès public S3 incomplet
absence de chiffrement explicite
absence de versioning
politique IAM trop large
usage de s3:*
usage de Resource: "*"
```

Si `--output-file-path console,...` échoue selon la version installée, les deux commandes séparées (section 4.1) produisent le même résultat.

### Résultat attendu avec Trivy

Trivy doit identifier des risques similaires. Les résultats ne sont pas forcément identiques à ceux de Checkov — les deux outils sont complémentaires.

### Remédiation attendue

```text
bloquer l'accès public S3 (4 paramètres à true)
activer le chiffrement côté serveur (AES256 ou KMS)
activer le versioning
ajouter des balises de gouvernance
remplacer s3:* par des actions explicites
remplacer Resource: "*" par des ARN ciblés
```

### Synthèse attendue

```text
une configuration Terraform valide n'est pas forcément sécurisée
les contrôles doivent être faits avant création des ressources
Checkov et Trivy sont complémentaires
les politiques IAM larges doivent être réduites
les ressources S3 doivent être durcies explicitement
terraform plan ne déploie pas — seul terraform apply déploie
```
