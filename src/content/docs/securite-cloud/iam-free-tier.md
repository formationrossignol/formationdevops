---
title: "TP : Gestion des identités IAM"
description: Maîtriser IAM en créant utilisateurs, groupes, policies personnalisées, rôles et en sécurisant le compte root avec MFA.
---

## Objectif

Maîtriser la gestion des identités et des accès (IAM) sur AWS en créant des utilisateurs, des groupes, des policies personnalisées, des rôles pour services AWS, et en sécurisant le compte root avec MFA.

## Compétences travaillées

- Création et gestion d'utilisateurs IAM
- Gestion de groupes et permissions
- Création de policies JSON personnalisées
- Principe du moindre privilège
- Création de rôles IAM pour services AWS
- Activation MFA sur compte root
- Gestion des credentials et rotation
- Audit des accès avec IAM Access Analyzer

## Architecture cible

```
Compte AWS Root
    |
    +-- MFA activé (sécurité renforcée)
    |
    +-- Utilisateurs IAM
    |   |
    |   +-- admin-user (groupe Administrators)
    |   +-- dev-user (groupe Developers)
    |   +-- readonly-user (groupe ReadOnly)
    |
    +-- Groupes IAM
    |   |
    |   +-- Administrators (AdministratorAccess)
    |   +-- Developers (policy custom)
    |   +-- ReadOnly (ReadOnlyAccess)
    |
    +-- Rôles IAM
        |
        +-- EC2-S3-Access-Role (pour instances EC2)
        +-- Lambda-Execution-Role (pour fonctions Lambda)
```

## Durée estimée

1 heure

## Coût

100% gratuit — IAM est un service sans frais.

---

## Étape 1 : Sécuriser le compte root avec MFA

IMPORTANT : Cette étape doit être faite EN PREMIER.

### 1.1 Se connecter avec le compte root

1. AWS Console → Root user
2. Entrez email + mot de passe root

### 1.2 Activer MFA sur root

1. Cliquez sur votre nom en haut à droite → Security credentials
2. Cliquez sur **Add MFA**

| Paramètre | Valeur |
|-----------|--------|
| Device name | root-account-mfa |
| MFA type | Authenticator app |

3. Installez Google Authenticator, Authy, ou Microsoft Authenticator
4. Scannez le QR code
5. Entrez deux codes consécutifs
6. Cliquez sur **Add MFA**

> Sans MFA sur le compte root, votre compte est vulnérable. Ne jamais utiliser root au quotidien.

---

## Étape 2 : Créer des groupes IAM

### 2.1 Groupe Administrators

1. IAM → User groups → **Create group**
2. Nom : `Administrators`
3. Policy : `AdministratorAccess`
4. Create group

### 2.2 Groupe Developers

1. Create group
2. Nom : `Developers`
3. Policies :
   - `AmazonEC2FullAccess`
   - `AmazonS3FullAccess`
   - `AmazonRDSFullAccess`
   - `CloudWatchLogsReadOnlyAccess`
4. Create group

### 2.3 Groupe ReadOnly

1. Create group
2. Nom : `ReadOnly`
3. Policy : `ReadOnlyAccess`
4. Create group

---

## Étape 3 : Créer des utilisateurs IAM

### 3.1 admin-user

1. IAM → Users → **Create user**
2. Username : `admin-user`
3. Console access : COCHÉ
4. Custom password : `AdminPass123!Secure`
5. Groupe : Administrators
6. Create user → **notez l'URL de connexion IAM**

### 3.2 dev-user

| Paramètre | Valeur |
|-----------|--------|
| Username | dev-user |
| Password | DevPass123!Secure |
| Groupe | Developers |

### 3.3 readonly-user

| Paramètre | Valeur |
|-----------|--------|
| Username | readonly-user |
| Password | ReadPass123!Secure |
| Groupe | ReadOnly |

### 3.4 api-user (accès programmatique)

1. Create user
2. Username : `api-user`
3. Console access : DÉCOCHÉ
4. Groupe : Developers
5. Create user
6. Onglet Security credentials → **Create access key**
7. Use case : CLI
8. **Notez immédiatement** Access Key ID et Secret Access Key — ils ne seront plus affichés

---

## Étape 4 : Créer une policy IAM personnalisée

### 4.1 Policy S3 par préfixe

1. IAM → Policies → **Create policy** → JSON

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ListAllBuckets",
            "Effect": "Allow",
            "Action": [
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation"
            ],
            "Resource": "*"
        },
        {
            "Sid": "ManageProjectBuckets",
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketVersioning",
                "s3:PutBucketVersioning"
            ],
            "Resource": "arn:aws:s3:::projet-*"
        },
        {
            "Sid": "ManageProjectObjects",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::projet-*/*"
        }
    ]
}
```

2. Policy name : `S3-Project-Buckets-Manager`
3. Create policy
4. Attacher à dev-user : Users → dev-user → Add permissions → Attach policies directly

### 4.2 Policy EC2 restreinte aux régions EU

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "ec2:*",
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "aws:RequestedRegion": ["eu-west-3", "eu-west-1"]
                }
            }
        }
    ]
}
```

Policy name : `EC2-EU-Regions-Only`

---

## Étape 5 : Créer des rôles IAM

### 5.1 Rôle pour EC2

1. IAM → Roles → **Create role**
2. Trusted entity : AWS service → EC2
3. Permission : `AmazonS3ReadOnlyAccess`
4. Role name : `EC2-S3-ReadOnly-Role`

### 5.2 Rôle pour Lambda

1. Create role
2. Trusted entity : AWS service → Lambda
3. Permission : `AWSLambdaBasicExecutionRole`
4. Role name : `Lambda-Basic-Execution-Role`

### 5.3 Rôle cross-account (avancé)

1. Create role
2. Trusted entity : AWS account → Another AWS account
3. Account ID : (compte externe)
4. Permission : `ReadOnlyAccess`
5. Role name : `CrossAccount-ReadOnly-Role`

---

## Étape 6 : Configurer la password policy

1. IAM → Account settings → Edit

| Paramètre | Valeur |
|-----------|--------|
| Minimum length | 14 |
| Uppercase | COCHÉ |
| Lowercase | COCHÉ |
| Number | COCHÉ |
| Special character | COCHÉ |
| Expiration | 90 jours |
| Password reuse | 5 passwords |

---

## Étape 7 : Auditer les accès

### Credential Report

```
IAM → Credential report → Download
```

Contient : utilisateur, MFA actif, date création, dernière utilisation des clés.

### Access Advisor

1. Users → sélectionnez un utilisateur
2. Onglet **Access Advisor**

Affiche quels services ont été utilisés → permet de retirer les permissions inutilisées.

### IAM Access Analyzer

1. IAM → Access analyzer → **Create analyzer**
2. Analyzer name : `account-analyzer`
3. Zone of trust : Current account

Détecte les ressources partagées avec des comptes externes, buckets S3 publics, etc.

---

## Checklist de sécurité IAM

- ☐ MFA activé sur compte root
- ☐ Compte root non utilisé au quotidien
- ☐ Pas d'access keys sur compte root
- ☐ Utilisateurs IAM individuels créés
- ☐ Groupes utilisés pour les permissions
- ☐ Principe du moindre privilège appliqué
- ☐ Password policy stricte configurée
- ☐ MFA activé sur utilisateurs admin
- ☐ CloudTrail activé
- ☐ Rotation des access keys < 90 jours
- ☐ Rôles utilisés pour services AWS

---

## Nettoyage

1. IAM → Users → sélectionnez et **Delete** les utilisateurs de test
2. User groups → Delete les groupes
3. Policies → Customer managed → Delete les policies custom
4. Roles → Delete les rôles créés

---

## Points clés

1. IAM est 100% gratuit
2. Le compte root ne doit JAMAIS être utilisé au quotidien
3. MFA obligatoire sur root et recommandé sur tous les admins
4. Permissions via groupes, pas directement sur les utilisateurs
5. Principe du moindre privilège : donnez le minimum nécessaire
6. Rôles IAM pour les services AWS (pas d'access keys en dur dans le code)
7. CloudTrail enregistre toutes les actions pour audit
