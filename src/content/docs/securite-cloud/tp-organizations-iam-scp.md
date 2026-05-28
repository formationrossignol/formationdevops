---
title: "TP : Gouvernance AWS Organizations avec utilisateurs IAM et SCP"
description: Comprendre AWS Organizations, les unités organisationnelles, les Service Control Policies et leur relation avec les utilisateurs IAM.
date: 2026-05-28
---

## Outils

AWS CLI, AWS Organizations, IAM

## Objectif

Ce TP permet de comprendre les bases d'AWS Organizations, des unités organisationnelles, des Service Control Policies et leur relation avec les utilisateurs IAM.

L'apprenant va :

1. vérifier le contexte AWS utilisé ;
2. créer ou vérifier une organisation AWS ;
3. explorer la racine de l'organisation ;
4. créer des unités organisationnelles ;
5. créer des politiques de contrôle de service ;
6. attacher les politiques à des unités organisationnelles ;
7. créer un utilisateur IAM de démonstration ;
8. créer une politique IAM permissive ;
9. comparer le rôle d'IAM et celui des SCP ;
10. vérifier les politiques attachées ;
11. nettoyer les ressources créées.

## Sources

| Sujet | Source |
|---|---|
| AWS Organizations | https://docs.aws.amazon.com/organizations/latest/userguide/orgs_introduction.html |
| Création d'une organisation | https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_org_create.html |
| Service Control Policies | https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html |
| Exemples de SCP | https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps_examples.html |
| AWS CLI Organizations | https://docs.aws.amazon.com/cli/latest/reference/organizations/ |
| IAM | https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html |
| Bonnes pratiques IAM | https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html |

## Durée indicative

| Séquence | Durée |
|---|---:|
| Préparation locale | 10 min |
| Vérification ou création de l'organisation | 15 min |
| Exploration de la structure | 20 min |
| Création des unités organisationnelles | 25 min |
| Création des SCP | 35 min |
| Attachement et vérification des SCP | 30 min |
| Création de l'utilisateur IAM | 25 min |
| Analyse IAM et SCP | 35 min |
| Nettoyage | 30 min |
| Total | 3 h 45 |

## Compétences travaillées

| Compétence | Niveau attendu |
|---|---|
| Comprendre AWS Organizations | Débutant |
| Manipuler la racine d'une organisation | Débutant |
| Créer une unité organisationnelle | Intermédiaire |
| Lire une politique de contrôle de service | Intermédiaire |
| Attacher et détacher une SCP | Intermédiaire |
| Créer un utilisateur IAM | Intermédiaire |
| Créer et attacher une politique IAM | Intermédiaire |
| Comprendre la différence entre IAM et SCP | Intermédiaire |
| Nettoyer une structure Organizations et IAM | Intermédiaire |

## Scénario

Une équipe cloud souhaite préparer une structure AWS Organizations simple.

Elle veut créer une organisation avec trois unités organisationnelles :

```text
Sandbox
Security
Workloads
```

L'objectif est de comprendre comment structurer une organisation, comment appliquer des garde-fous avec des Service Control Policies et comment ces garde-fous se distinguent des politiques IAM attachées à des utilisateurs.

Le TP introduit deux SCP :

```text
DenyCloudTrailDisable
DenyOutsideEuWest1
```

Il crée aussi un utilisateur IAM de démonstration :

```text
org-demo-operator
```

Cet utilisateur reçoit une politique IAM qui autorise certaines actions CloudTrail. Cela permet d'illustrer la différence entre une autorisation IAM locale et un garde-fou organisationnel.

## Notions clés

| Notion | Explication |
|---|---|
| Organisation | Ensemble de comptes AWS gérés centralement |
| Compte de gestion | Compte qui crée et administre l'organisation |
| Racine | Niveau supérieur de l'organisation |
| Unité organisationnelle | Conteneur logique pour regrouper des comptes ou d'autres unités |
| Compte membre | Compte AWS rattaché à l'organisation |
| Utilisateur IAM | Identité locale à un compte AWS |
| Politique IAM | Politique qui accorde ou refuse des permissions dans un compte |
| SCP | Politique de contrôle de service appliquée à une racine, une unité organisationnelle ou un compte |
| Garde-fou | Règle centrale qui limite ce qui peut être fait dans un périmètre |

## Différence entre IAM et SCP

| Élément | IAM | SCP |
|---|---|---|
| Rôle principal | Accorder des permissions | Définir le maximum autorisé |
| Portée | Identité ou ressource dans un compte | Organisation, unité organisationnelle ou compte |
| Peut autoriser une action seule | Oui | Non |
| Peut bloquer une action | Oui, via un refus explicite | Oui, via un refus explicite |
| Exemple | Autoriser `cloudtrail:StopLogging` | Interdire `cloudtrail:StopLogging` |
| Usage | Gestion opérationnelle des droits | Gouvernance centrale |

Une SCP n'accorde pas de permissions. Elle limite les permissions maximales possibles dans son périmètre.

Une action est autorisée uniquement si :

```text
la politique IAM autorise l'action
et
aucune SCP applicable ne bloque l'action
```

:::caution[Compte de gestion hors périmètre SCP]
Les SCP ne s'appliquent **jamais** au compte de gestion de l'organisation, même si elles sont attachées à la racine. Dans ce TP, l'utilisateur IAM `org-demo-operator` est créé dans le compte de gestion — la SCP `DenyCloudTrailDisable` ne le contraindra donc pas. L'objectif est d'illustrer le modèle conceptuel, pas de démontrer l'effet d'une SCP sur un compte membre distinct.
:::

---

## 1. Préparation de l'environnement

### 1.1. Créer le répertoire de travail

```bash
mkdir -p tp-aws-organizations
cd tp-aws-organizations
mkdir -p politiques rapports notes
```

### 1.2. Vérifier AWS CLI et l'identité AWS utilisée

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

### 1.3. Définir les variables du TP

```bash
PROFIL_AWS="default"
REGION_AWS="eu-west-1"
NOM_OU_SANDBOX="Sandbox"
NOM_OU_SECURITY="Security"
NOM_OU_WORKLOADS="Workloads"
NOM_SCP_CLOUDTRAIL="DenyCloudTrailDisable"
NOM_SCP_REGION="DenyOutsideEuWest1"
UTILISATEUR_IAM_DEMO="org-demo-operator"
NOM_POLITIQUE_IAM_DEMO="OrgDemoCloudTrailOperatorPolicy"

ID_COMPTE=$(aws sts get-caller-identity \
  --profile "$PROFIL_AWS" \
  --query Account \
  --output text)

ARN_POLITIQUE_IAM_DEMO="arn:aws:iam::$ID_COMPTE:policy/$NOM_POLITIQUE_IAM_DEMO"

echo "$PROFIL_AWS / $REGION_AWS / $ID_COMPTE"
echo "$NOM_SCP_CLOUDTRAIL / $NOM_SCP_REGION"
echo "$UTILISATEUR_IAM_DEMO / $NOM_POLITIQUE_IAM_DEMO"
```

---

## 2. Vérification ou création de l'organisation

### 2.1. Vérifier si une organisation existe déjà

```bash
aws organizations describe-organization \
  --profile "$PROFIL_AWS"
```

Si la commande retourne les informations de l'organisation, passer directement à la section 3.

### 2.2. Créer une organisation

:::danger[Opération quasi-irréversible]
La création d'une organisation AWS est une opération quasi-irréversible. La supprimer impose d'attendre 7 jours, de désactiver toutes les fonctionnalités et de satisfaire plusieurs conditions strictes. N'exécuter cette commande que dans un compte sandbox dédié, jamais dans un compte de production.
:::

```bash
aws organizations create-organization \
  --feature-set ALL \
  --profile "$PROFIL_AWS"
```

### 2.3. Vérifier l'organisation

```bash
aws organizations describe-organization \
  --profile "$PROFIL_AWS"
```

Éléments attendus dans la sortie : `Id`, `Arn`, `FeatureSet`, `ManagementAccountId`, `ManagementAccountEmail`.

Le mode `ALL` permet d'utiliser les fonctionnalités complètes, notamment les SCP.

---

## 3. Exploration de la racine de l'organisation

### 3.1. Récupérer l'identifiant de la racine

```bash
ROOT_ID=$(aws organizations list-roots \
  --profile "$PROFIL_AWS" \
  --query 'Roots[0].Id' \
  --output text)

echo "$ROOT_ID"
```

### 3.2. Sauvegarder les informations de racine

```bash
aws organizations list-roots \
  --profile "$PROFIL_AWS" \
  > rapports/roots.json

cat rapports/roots.json
```

### 3.3. Explorer la structure

```bash
aws organizations list-accounts \
  --profile "$PROFIL_AWS"

aws organizations list-organizational-units-for-parent \
  --parent-id "$ROOT_ID" \
  --profile "$PROFIL_AWS"
```

La racine est le point d'entrée de l'organisation. Les unités organisationnelles sont créées sous la racine ou sous une autre unité. Les comptes peuvent être attachés à la racine ou à une unité.

---

## 4. Création des unités organisationnelles

Les IDs des unités sont extraits directement depuis la sortie en mémoire pour éviter toute dépendance à un fichier intermédiaire.

### 4.1. Créer l'unité Sandbox

```bash
OU_SANDBOX_ID=$(aws organizations create-organizational-unit \
  --parent-id "$ROOT_ID" \
  --name "$NOM_OU_SANDBOX" \
  --profile "$PROFIL_AWS" \
  --query 'OrganizationalUnit.Id' \
  --output text)

echo "Sandbox : $OU_SANDBOX_ID"
```

### 4.2. Créer l'unité Security

```bash
OU_SECURITY_ID=$(aws organizations create-organizational-unit \
  --parent-id "$ROOT_ID" \
  --name "$NOM_OU_SECURITY" \
  --profile "$PROFIL_AWS" \
  --query 'OrganizationalUnit.Id' \
  --output text)

echo "Security : $OU_SECURITY_ID"
```

### 4.3. Créer l'unité Workloads

```bash
OU_WORKLOADS_ID=$(aws organizations create-organizational-unit \
  --parent-id "$ROOT_ID" \
  --name "$NOM_OU_WORKLOADS" \
  --profile "$PROFIL_AWS" \
  --query 'OrganizationalUnit.Id' \
  --output text)

echo "Workloads : $OU_WORKLOADS_ID"
```

### 4.4. Vérifier les unités créées

```bash
aws organizations list-organizational-units-for-parent \
  --parent-id "$ROOT_ID" \
  --profile "$PROFIL_AWS"
```

### 4.5. Créer une synthèse de structure

```bash
cat > notes/structure-organisation.md <<EOF
# Structure AWS Organizations

Racine : $ROOT_ID

Unités organisationnelles créées :
- $NOM_OU_SANDBOX : $OU_SANDBOX_ID
- $NOM_OU_SECURITY : $OU_SECURITY_ID
- $NOM_OU_WORKLOADS : $OU_WORKLOADS_ID
EOF

cat notes/structure-organisation.md
```

---

## 5. Création d'une SCP de protection CloudTrail

### 5.1. Créer le fichier de politique

```bash
cat > politiques/deny-cloudtrail-disable.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyCloudTrailDisable",
      "Effect": "Deny",
      "Action": [
        "cloudtrail:StopLogging",
        "cloudtrail:DeleteTrail",
        "cloudtrail:UpdateTrail"
      ],
      "Resource": "*"
    }
  ]
}
EOF

python -m json.tool politiques/deny-cloudtrail-disable.json
```

### 5.2. Créer la SCP dans AWS Organizations

```bash
SCP_CLOUDTRAIL_ID=$(aws organizations create-policy \
  --name "$NOM_SCP_CLOUDTRAIL" \
  --description "Empêche la désactivation ou la suppression de CloudTrail" \
  --type SERVICE_CONTROL_POLICY \
  --content file://politiques/deny-cloudtrail-disable.json \
  --profile "$PROFIL_AWS" \
  --query 'Policy.PolicySummary.Id' \
  --output text)

echo "SCP CloudTrail : $SCP_CLOUDTRAIL_ID"
```

### 5.3. Vérifier la création

```bash
aws organizations list-policies \
  --filter SERVICE_CONTROL_POLICY \
  --profile "$PROFIL_AWS"
```

La SCP existe dans l'organisation mais n'a pas encore d'effet — elle doit être attachée à une cible.

---

## 6. Attachement de la SCP CloudTrail à Sandbox

### 6.1. Attacher la SCP

```bash
aws organizations attach-policy \
  --policy-id "$SCP_CLOUDTRAIL_ID" \
  --target-id "$OU_SANDBOX_ID" \
  --profile "$PROFIL_AWS"
```

### 6.2. Vérifier les politiques attachées à Sandbox

```bash
aws organizations list-policies-for-target \
  --target-id "$OU_SANDBOX_ID" \
  --filter SERVICE_CONTROL_POLICY \
  --profile "$PROFIL_AWS"
```

### 6.3. Vérifier les cibles de la SCP

```bash
aws organizations list-targets-for-policy \
  --policy-id "$SCP_CLOUDTRAIL_ID" \
  --profile "$PROFIL_AWS"
```

La SCP est attachée à Sandbox. Elle s'applique aux comptes membres placés dans cette unité. Dans ce TP, aucun compte membre supplémentaire n'est créé — l'objectif est de comprendre l'attachement et la gouvernance par unité organisationnelle.

---

## 7. Création d'une SCP de restriction régionale

### 7.1. Créer le fichier de politique

:::caution[Usage illustratif uniquement]
Cette SCP est fournie à titre illustratif. La liste des services exclus via `NotAction` est volontairement simplifiée. En production, des services globaux supplémentaires (`acm:*`, `waf:*`, `budgets:*`, `health:*`...) doivent également être exclus. Ne pas attacher cette SCP à la racine ni à un périmètre large sans audit complet préalable.
:::

```bash
cat > politiques/deny-outside-eu-west-1.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyOutsideEuWest1",
      "Effect": "Deny",
      "NotAction": [
        "iam:*",
        "organizations:*",
        "route53:*",
        "cloudfront:*",
        "support:*",
        "sts:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": "eu-west-1"
        }
      }
    }
  ]
}
EOF

python -m json.tool politiques/deny-outside-eu-west-1.json
```

### 7.2. Créer la SCP régionale

```bash
SCP_REGION_ID=$(aws organizations create-policy \
  --name "$NOM_SCP_REGION" \
  --description "Limite l'usage des services régionaux hors eu-west-1 — usage illustratif uniquement" \
  --type SERVICE_CONTROL_POLICY \
  --content file://politiques/deny-outside-eu-west-1.json \
  --profile "$PROFIL_AWS" \
  --query 'Policy.PolicySummary.Id' \
  --output text)

echo "SCP Région : $SCP_REGION_ID"
```

### 7.3. Attacher la SCP régionale à Workloads

```bash
aws organizations attach-policy \
  --policy-id "$SCP_REGION_ID" \
  --target-id "$OU_WORKLOADS_ID" \
  --profile "$PROFIL_AWS"
```

### 7.4. Vérifier les politiques attachées à Workloads

```bash
aws organizations list-policies-for-target \
  --target-id "$OU_WORKLOADS_ID" \
  --filter SERVICE_CONTROL_POLICY \
  --profile "$PROFIL_AWS"
```

---

## 8. Création d'un utilisateur IAM de démonstration

```bash
aws iam create-user \
  --user-name "$UTILISATEUR_IAM_DEMO" \
  --profile "$PROFIL_AWS"

aws iam get-user \
  --user-name "$UTILISATEUR_IAM_DEMO" \
  --profile "$PROFIL_AWS"
```

---

## 9. Création d'une politique IAM permissive

### 9.1. Créer le fichier de politique

```bash
cat > politiques/org-demo-cloudtrail-operator-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudTrailAdministrationForDemo",
      "Effect": "Allow",
      "Action": [
        "cloudtrail:CreateTrail",
        "cloudtrail:UpdateTrail",
        "cloudtrail:DeleteTrail",
        "cloudtrail:StartLogging",
        "cloudtrail:StopLogging",
        "cloudtrail:DescribeTrails",
        "cloudtrail:GetTrailStatus"
      ],
      "Resource": "*"
    }
  ]
}
EOF

python -m json.tool politiques/org-demo-cloudtrail-operator-policy.json
```

### 9.2. Créer la politique IAM et l'attacher à l'utilisateur

```bash
aws iam create-policy \
  --policy-name "$NOM_POLITIQUE_IAM_DEMO" \
  --policy-document file://politiques/org-demo-cloudtrail-operator-policy.json \
  --profile "$PROFIL_AWS"

aws iam attach-user-policy \
  --user-name "$UTILISATEUR_IAM_DEMO" \
  --policy-arn "$ARN_POLITIQUE_IAM_DEMO" \
  --profile "$PROFIL_AWS"

aws iam list-attached-user-policies \
  --user-name "$UTILISATEUR_IAM_DEMO" \
  --profile "$PROFIL_AWS"
```

---

## 10. Analyse IAM et SCP

### 10.1. Ce que permet la politique IAM

La politique IAM créée autorise l'utilisateur à administrer CloudTrail, y compris :

```text
cloudtrail:UpdateTrail
cloudtrail:DeleteTrail
cloudtrail:StopLogging
```

Ces actions sont sensibles car elles peuvent modifier, supprimer ou interrompre la journalisation.

### 10.2. Ce que bloque la SCP CloudTrail

La SCP `DenyCloudTrailDisable` bloque :

```text
cloudtrail:StopLogging
cloudtrail:DeleteTrail
cloudtrail:UpdateTrail
```

### 10.3. Modèle d'évaluation

| Politique IAM | SCP | Résultat effectif |
|---|---|---|
| Autorise `cloudtrail:StopLogging` | Ne bloque pas | Action possible |
| Autorise `cloudtrail:StopLogging` | Bloque explicitement | Action refusée |
| N'autorise pas `cloudtrail:StopLogging` | Ne bloque pas | Action refusée |
| N'autorise pas `cloudtrail:StopLogging` | Bloque explicitement | Action refusée |

### 10.4. Point pédagogique

IAM sert à accorder les permissions opérationnelles. SCP sert à poser des garde-fous organisationnels.

Une bonne gouvernance AWS combine des politiques IAM limitées, des rôles plutôt que des utilisateurs permanents quand c'est possible, des SCP simples et testées, une séparation claire des comptes et une journalisation protégée.

---

## 11. Visualisation de la structure organisationnelle

### 11.1. Lister les unités et leurs politiques

```bash
aws organizations list-organizational-units-for-parent \
  --parent-id "$ROOT_ID" \
  --profile "$PROFIL_AWS"

aws organizations list-policies-for-target \
  --target-id "$OU_SANDBOX_ID" \
  --filter SERVICE_CONTROL_POLICY \
  --profile "$PROFIL_AWS"

aws organizations list-policies-for-target \
  --target-id "$OU_SECURITY_ID" \
  --filter SERVICE_CONTROL_POLICY \
  --profile "$PROFIL_AWS"

aws organizations list-policies-for-target \
  --target-id "$OU_WORKLOADS_ID" \
  --filter SERVICE_CONTROL_POLICY \
  --profile "$PROFIL_AWS"
```

### 11.2. Créer une synthèse de gouvernance

```bash
cat > notes/gouvernance-organizations.md <<EOF
# Gouvernance AWS Organizations

## Structure

Racine : $ROOT_ID

## Unités organisationnelles

- Sandbox : $OU_SANDBOX_ID
- Security : $OU_SECURITY_ID
- Workloads : $OU_WORKLOADS_ID

## SCP créées

- $NOM_SCP_CLOUDTRAIL : $SCP_CLOUDTRAIL_ID
- $NOM_SCP_REGION : $SCP_REGION_ID

## Attachements

- Sandbox reçoit la SCP $NOM_SCP_CLOUDTRAIL.
- Workloads reçoit la SCP $NOM_SCP_REGION.
- Security ne reçoit pas de SCP spécifique dans ce TP.

## Utilisateur IAM de démonstration

- Utilisateur : $UTILISATEUR_IAM_DEMO
- Politique IAM : $NOM_POLITIQUE_IAM_DEMO

## Rappel

Les SCP ne s'appliquent pas au compte de gestion.
L'utilisateur IAM est dans le compte de gestion — la démonstration est conceptuelle.
EOF

cat notes/gouvernance-organizations.md
```

---

## 12. Commandes d'inspection complémentaires

```bash
# Lister toutes les SCP
aws organizations list-policies \
  --filter SERVICE_CONTROL_POLICY \
  --profile "$PROFIL_AWS"

# Décrire les SCP
aws organizations describe-policy --policy-id "$SCP_CLOUDTRAIL_ID" --profile "$PROFIL_AWS"
aws organizations describe-policy --policy-id "$SCP_REGION_ID"     --profile "$PROFIL_AWS"

# Lister les cibles
aws organizations list-targets-for-policy --policy-id "$SCP_CLOUDTRAIL_ID" --profile "$PROFIL_AWS"
aws organizations list-targets-for-policy --policy-id "$SCP_REGION_ID"     --profile "$PROFIL_AWS"

# Inspecter la politique IAM
VERSION_POLITIQUE_IAM=$(aws iam get-policy \
  --policy-arn "$ARN_POLITIQUE_IAM_DEMO" \
  --profile "$PROFIL_AWS" \
  --query 'Policy.DefaultVersionId' \
  --output text)

aws iam get-policy-version \
  --policy-arn "$ARN_POLITIQUE_IAM_DEMO" \
  --version-id "$VERSION_POLITIQUE_IAM" \
  --profile "$PROFIL_AWS"
```

---

## 13. Analyse des garde-fous

### 13.1. Garde-fou CloudTrail

La SCP `DenyCloudTrailDisable` protège la capacité d'audit. Elle évite qu'une identité dans un compte membre désactive ou supprime CloudTrail. Elle n'active pas CloudTrail — elle empêche uniquement certaines actions de le désactiver.

### 13.2. Garde-fou régional

La SCP `DenyOutsideEuWest1` utilise `Effect: Deny` avec `NotAction` et la condition `aws:RequestedRegion`. Elle bloque les actions hors eu-west-1, sauf pour les services listés dans `NotAction`. Cette liste est incomplète pour un usage réel — à compléter avant tout déploiement effectif.

### 13.3. Utilisateur IAM de démonstration

La politique IAM attachée à `org-demo-operator` autorise certaines actions CloudTrail. IAM accorde des permissions locales au compte. Une SCP peut réduire le plafond maximal d'autorisations dans un compte membre — mais pas dans le compte de gestion.

---

## 14. Nettoyage IAM

```bash
aws iam detach-user-policy \
  --user-name "$UTILISATEUR_IAM_DEMO" \
  --policy-arn "$ARN_POLITIQUE_IAM_DEMO" \
  --profile "$PROFIL_AWS"

aws iam delete-policy \
  --policy-arn "$ARN_POLITIQUE_IAM_DEMO" \
  --profile "$PROFIL_AWS"

aws iam delete-user \
  --user-name "$UTILISATEUR_IAM_DEMO" \
  --profile "$PROFIL_AWS"

# Vérification — doit retourner NoSuchEntity
aws iam get-user \
  --user-name "$UTILISATEUR_IAM_DEMO" \
  --profile "$PROFIL_AWS"
```

---

## 15. Nettoyage des SCP

### 15.1. Détacher les SCP

```bash
aws organizations detach-policy \
  --policy-id "$SCP_CLOUDTRAIL_ID" \
  --target-id "$OU_SANDBOX_ID" \
  --profile "$PROFIL_AWS"

aws organizations detach-policy \
  --policy-id "$SCP_REGION_ID" \
  --target-id "$OU_WORKLOADS_ID" \
  --profile "$PROFIL_AWS"
```

### 15.2. Vérifier le détachement

```bash
aws organizations list-targets-for-policy \
  --policy-id "$SCP_CLOUDTRAIL_ID" \
  --profile "$PROFIL_AWS"

aws organizations list-targets-for-policy \
  --policy-id "$SCP_REGION_ID" \
  --profile "$PROFIL_AWS"
```

Résultat attendu : liste vide (`"Targets": []`) pour chaque SCP.

### 15.3. Supprimer les SCP

```bash
aws organizations delete-policy \
  --policy-id "$SCP_CLOUDTRAIL_ID" \
  --profile "$PROFIL_AWS"

aws organizations delete-policy \
  --policy-id "$SCP_REGION_ID" \
  --profile "$PROFIL_AWS"

# Vérification
aws organizations list-policies \
  --filter SERVICE_CONTROL_POLICY \
  --profile "$PROFIL_AWS"
```

---

## 16. Nettoyage des unités organisationnelles

```bash
aws organizations delete-organizational-unit \
  --organizational-unit-id "$OU_SANDBOX_ID" \
  --profile "$PROFIL_AWS"

aws organizations delete-organizational-unit \
  --organizational-unit-id "$OU_SECURITY_ID" \
  --profile "$PROFIL_AWS"

aws organizations delete-organizational-unit \
  --organizational-unit-id "$OU_WORKLOADS_ID" \
  --profile "$PROFIL_AWS"

# Vérification — doit retourner une liste vide
aws organizations list-organizational-units-for-parent \
  --parent-id "$ROOT_ID" \
  --profile "$PROFIL_AWS"
```

---

## 17. Nettoyage local

:::note[Organisation AWS non supprimée]
L'organisation AWS créée à l'étape 2 n'est pas supprimée par ce TP. La supprimer est une opération distincte qui impose d'attendre 7 jours et de satisfaire plusieurs conditions. Si le compte sandbox n'est pas réutilisé, l'organisation peut rester en place sans impact fonctionnel ni coût direct. Documentation : https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_org_delete.html
:::

```bash
rm -rf rapports politiques notes
cd ..
rm -rf tp-aws-organizations
```

---

## 18. Repères formateur

### 18.1. Résultat attendu

Le TP doit permettre de comprendre organisation, compte de gestion, racine, unité organisationnelle, utilisateur IAM, politique IAM, SCP, attachement de politique et garde-fou organisationnel.

### 18.2. Structure organisationnelle

Les trois unités (`Sandbox`, `Security`, `Workloads`) illustrent une séparation simple : environnements de test, comptes de sécurité, charges applicatives.

### 18.3. SCP CloudTrail

Empêche `cloudtrail:StopLogging`, `cloudtrail:DeleteTrail` et `cloudtrail:UpdateTrail`.

### 18.4. SCP régionale

Illustre une restriction à `eu-west-1` avec exceptions pour les services globaux — liste à compléter avant tout usage réel.

### 18.5. Utilisateur IAM de démonstration

L'utilisateur `org-demo-operator` illustre que IAM accorde des permissions locales et que SCP pose des garde-fous organisationnels — mais que les SCP ne s'appliquent pas au compte de gestion.

### 18.6. Points de vigilance

- Une SCP ne donne jamais de permission. Elle limite les permissions maximales disponibles.
- Elle doit être testée progressivement et jamais attachée à un périmètre large sans évaluation de l'impact.
- La création d'une organisation est quasi-irréversible : suppression nécessite 7 jours d'attente.
- Les SCP ne s'appliquent pas au compte de gestion — règle fondamentale AWS.

### 18.7. Synthèse

AWS Organizations structure la gouvernance multi-comptes. Les SCP posent des garde-fous centraux. IAM gère les permissions locales dans les comptes. La bonne approche combine une structure d'organisation claire, des unités cohérentes, des SCP simples et testées, un IAM local limité, une journalisation protégée et une revue régulière des garde-fous.
