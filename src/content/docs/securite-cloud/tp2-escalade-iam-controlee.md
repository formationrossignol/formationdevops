---
title: "TP 2 : Escalade IAM contrôlée"
description: Analyser une configuration IAM vulnérable avec Cloudsplaining et PMapper pour identifier et corriger une escalade de privilèges indirecte via iam:CreatePolicyVersion.
---

## Outils

Cloudsplaining, PMapper

## Objectif

Ce TP permet d'analyser une configuration IAM AWS volontairement vulnérable afin d'identifier une escalade de privilèges indirecte.

L'apprenant va :

1. créer une politique IAM vulnérable ;
2. créer un utilisateur IAM de test ;
3. attacher la politique vulnérable à cet utilisateur ;
4. analyser les permissions avec Cloudsplaining ;
5. analyser les capacités IAM avec PMapper ;
6. identifier le chemin d'escalade ;
7. appliquer une politique corrigée ;
8. vérifier que le risque est réduit ;
9. nettoyer les ressources créées.

## Sources

| Sujet | Source |
|---|---|
| AWS IAM | https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html |
| Cloudsplaining | https://github.com/salesforce/cloudsplaining |
| PMapper | https://github.com/nccgroup/PMapper |
| Escalades IAM AWS documentées | https://github.com/RhinoSecurityLabs/AWS-IAM-Privilege-Escalation |

## Durée indicative

| Séquence | Durée |
|---|---:|
| Préparation locale | 15 min |
| Création du lab IAM | 25 min |
| Analyse avec Cloudsplaining | 40 min |
| Analyse avec PMapper | 50 min |
| Remédiation | 35 min |
| Nettoyage | 15 min |
| Total | 3 h |

## Compétences travaillées

| Compétence | Niveau attendu |
|---|---|
| Lire une politique IAM au format JSON | Intermédiaire |
| Identifier une permission IAM dangereuse | Intermédiaire |
| Comprendre une escalade IAM indirecte | Intermédiaire |
| Utiliser Cloudsplaining sur une politique IAM | Intermédiaire |
| Utiliser PMapper pour analyser un graphe IAM | Avancé |
| Proposer une remédiation IAM | Avancé |

## Scénario

Une équipe sécurité audite un compte AWS de test.

Un utilisateur IAM nommé `dev-audit-user` dispose d'une politique appelée `AuditWeakPolicy`.

À première vue, cet utilisateur semble principalement disposer de permissions de lecture IAM :

```text
iam:Get*
iam:List*
sts:GetCallerIdentity
```

La même politique contient cependant deux permissions sensibles :

```text
iam:CreatePolicyVersion
iam:SetDefaultPolicyVersion
```

Ces permissions peuvent permettre de créer une nouvelle version d'une politique IAM, puis de rendre cette version active.

Le risque étudié dans ce TP est une escalade IAM indirecte par manipulation des versions de politique.

## Logique du TP

| Étape | Objectif |
|---|---|
| Préparer l'environnement | Installer les outils nécessaires |
| Créer une politique vulnérable | Introduire une mauvaise configuration IAM contrôlée |
| Créer un utilisateur IAM de test | Disposer d'une identité à analyser |
| Attacher la politique vulnérable | Créer le contexte d'escalade |
| Analyser avec Cloudsplaining | Identifier les violations du moindre privilège |
| Analyser avec PMapper | Identifier les permissions sensibles dans un graphe IAM |
| Corriger la politique | Supprimer le chemin d'escalade |
| Vérifier après correction | Confirmer la réduction du risque |
| Nettoyer le lab | Supprimer les ressources IAM créées |

---

## Étape 1 : Préparation de l'environnement

## 1.1. Créer le répertoire de travail

```bash
mkdir -p tp-iam-escalade-controlee
cd tp-iam-escalade-controlee
```

```bash
mkdir -p politiques
mkdir -p rapports
mkdir -p rapports/cloudsplaining-local
mkdir -p rapports/cloudsplaining-compte
mkdir -p rapports/pmapper
```

## 1.2. Créer l'environnement Python

```bash
python3 -m venv .venv
```

```bash
source .venv/bin/activate   # Linux/macOS
# ou
.\.venv\Scripts\Activate    # Windows PowerShell
```

```bash
python -m pip install --upgrade pip
```

## 1.3. Installer les outils

```bash
pip install awscli boto3 botocore cloudsplaining principalmapper
```

## 1.4. Vérifier les outils

```bash
aws --version
cloudsplaining --help
pmapper --help
```

## 1.5. Vérifier le profil AWS d'administration

```bash
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

Le profil `default` est utilisé comme profil d'administration du compte de test pour créer et supprimer les ressources IAM du TP.

---

## Étape 2 : Création des fichiers de politiques IAM

## 2.1. Créer la politique vulnérable

Créer le fichier `politiques/weak-policy.json` :

```bash
cat > politiques/weak-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "IamDiscovery",
      "Effect": "Allow",
      "Action": [
        "iam:Get*",
        "iam:List*",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    },
    {
      "Sid": "PolicyVersionPrivilegeEscalation",
      "Effect": "Allow",
      "Action": [
        "iam:CreatePolicyVersion",
        "iam:SetDefaultPolicyVersion"
      ],
      "Resource": "*"
    }
  ]
}
EOF
```

Vérifier le contenu :

```bash
cat politiques/weak-policy.json
```

Cette politique donne des droits de lecture IAM larges et deux permissions dangereuses de gestion des versions de politiques.

`iam:CreatePolicyVersion` peut permettre de créer une nouvelle version plus permissive d'une politique existante.

`iam:SetDefaultPolicyVersion` peut permettre de rendre cette version active.

Le risque vient de leur combinaison.

## 2.2. Créer une politique de simulation d'impact

Créer le fichier `politiques/privilege-simulation-policy.json` :

```bash
cat > politiques/privilege-simulation-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SimulatedFullAdminImpact",
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*"
    }
  ]
}
EOF
```

Vérifier le contenu :

```bash
cat politiques/privilege-simulation-policy.json
```

Cette politique illustre l'impact potentiel d'une version trop permissive. Elle sert uniquement à comprendre le niveau de risque associé à une manipulation des versions de politique. Elle n'est **pas** déployée dans AWS.

## 2.3. Créer la politique corrigée

Créer le fichier `politiques/corrected-policy.json` :

```bash
cat > politiques/corrected-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "IamReadOnlyDiscoveryStrict",
      "Effect": "Allow",
      "Action": [
        "iam:GetUser",
        "iam:GetRole",
        "iam:GetPolicy",
        "iam:GetPolicyVersion",
        "iam:ListUsers",
        "iam:ListRoles",
        "iam:ListPolicies",
        "iam:ListPolicyVersions",
        "iam:ListAttachedUserPolicies",
        "iam:ListAttachedRolePolicies",
        "iam:ListUserPolicies",
        "iam:ListRolePolicies",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
EOF
```

Vérifier le contenu :

```bash
cat politiques/corrected-policy.json
```

Cette politique retire les permissions de gestion des versions de politiques et remplace les jokers `iam:Get*` et `iam:List*` par une liste explicite d'actions de lecture.

## 2.4. Vérifier la validité JSON des fichiers

```bash
python -m json.tool politiques/weak-policy.json
python -m json.tool politiques/privilege-simulation-policy.json
python -m json.tool politiques/corrected-policy.json
```

Les trois fichiers doivent être valides au format JSON.

---

## Étape 3 : Création des ressources IAM

## 3.1. Récupérer l'identifiant du compte AWS

```bash
ID_COMPTE=$(aws sts get-caller-identity \
  --profile default \
  --query Account \
  --output text)
echo "$ID_COMPTE"
```

## 3.2. Définir les variables du lab

```bash
UTILISATEUR_LAB="dev-audit-user"
NOM_POLITIQUE="AuditWeakPolicy"
ARN_POLITIQUE="arn:aws:iam::$ID_COMPTE:policy/$NOM_POLITIQUE"
PROFIL_TEST="iam-lab-user"
REGION_AWS="eu-west-1"
```

Vérifier les variables :

```bash
echo "$UTILISATEUR_LAB"
echo "$NOM_POLITIQUE"
echo "$ARN_POLITIQUE"
echo "$PROFIL_TEST"
echo "$REGION_AWS"
```

## 3.3. Créer l'utilisateur IAM de test

```bash
aws iam create-user \
  --user-name "$UTILISATEUR_LAB" \
  --profile default
```

Vérifier l'utilisateur :

```bash
aws iam get-user \
  --user-name "$UTILISATEUR_LAB" \
  --profile default
```

La sortie doit contenir un ARN de ce type :

```text
arn:aws:iam::<account-id>:user/dev-audit-user
```

## 3.4. Créer la politique IAM vulnérable dans AWS

```bash
aws iam create-policy \
  --policy-name "$NOM_POLITIQUE" \
  --policy-document file://politiques/weak-policy.json \
  --profile default
```

Vérifier la politique :

```bash
aws iam get-policy \
  --policy-arn "$ARN_POLITIQUE" \
  --profile default
```

## 3.5. Attacher la politique à l'utilisateur de test

```bash
aws iam attach-user-policy \
  --user-name "$UTILISATEUR_LAB" \
  --policy-arn "$ARN_POLITIQUE" \
  --profile default
```

Vérifier les politiques attachées :

```bash
aws iam list-attached-user-policies \
  --user-name "$UTILISATEUR_LAB" \
  --profile default
```

La sortie doit contenir la politique `AuditWeakPolicy`.

## 3.6. Créer une clé d'accès pour l'utilisateur de test

> **Sécurité** : les clés d'accès sont des secrets. On les lit directement dans des variables shell sans les écrire sur disque, pour éviter toute fuite par fichier temporaire.

Créer la clé et stocker les valeurs directement en mémoire :

```bash
CREDS=$(aws iam create-access-key \
  --user-name "$UTILISATEUR_LAB" \
  --profile default)

ACCESS_KEY_ID=$(echo "$CREDS" | python3 -c "import sys,json; print(json.load(sys.stdin)['AccessKey']['AccessKeyId'])")
SECRET_ACCESS_KEY=$(echo "$CREDS" | python3 -c "import sys,json; print(json.load(sys.stdin)['AccessKey']['SecretAccessKey'])")
```

Vérifier que les variables sont bien renseignées (la clé secrète ne doit pas être affichée en production, mais c'est acceptable dans ce contexte de lab) :

```bash
echo "Access Key ID : $ACCESS_KEY_ID"
```

Configurer le profil AWS CLI de l'utilisateur de test :

```bash
aws configure set aws_access_key_id "$ACCESS_KEY_ID" --profile "$PROFIL_TEST"
aws configure set aws_secret_access_key "$SECRET_ACCESS_KEY" --profile "$PROFIL_TEST"
aws configure set region "$REGION_AWS" --profile "$PROFIL_TEST"
```

Vérifier l'identité du profil de test :

```bash
aws sts get-caller-identity --profile "$PROFIL_TEST"
```

Résultat attendu :

```json
{
  "UserId": "AIDAEXAMPLE",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/dev-audit-user"
}
```

---

## Étape 4 : Vérification initiale des permissions

## 4.1. Tester une action STS autorisée

```bash
aws sts get-caller-identity --profile "$PROFIL_TEST"
```

## 4.2. Tester une action IAM de lecture

```bash
aws iam list-users --profile "$PROFIL_TEST"
```

La commande doit fonctionner car la politique contient `iam:List*`.

## 4.3. Tester la lecture des politiques attachées

```bash
aws iam list-attached-user-policies \
  --user-name "$UTILISATEUR_LAB" \
  --profile "$PROFIL_TEST"
```

La commande doit fonctionner car la politique contient `iam:List*`.

---

## Étape 5 : Analyse avec Cloudsplaining

## 5.1. Analyser la politique vulnérable localement

```bash
cloudsplaining scan-policy-file \
  --input-file politiques/weak-policy.json \
  > rapports/cloudsplaining-local/weak-policy-cloudsplaining.txt

cat rapports/cloudsplaining-local/weak-policy-cloudsplaining.txt
```

Analyse attendue :

| Constat | Permission | Niveau de risque | Correction attendue |
|---|---|---:|---|
| Escalade de privilèges | `iam:CreatePolicyVersion` | Élevé | Retirer cette permission |
| Escalade de privilèges | `iam:SetDefaultPolicyVersion` | Élevé | Retirer cette permission |
| Ressource globale | `Resource: "*"` | Moyen à élevé | Restreindre lorsque possible |
| Action avec joker | `iam:Get*`, `iam:List*` | Moyen | Remplacer par une liste explicite |

## 5.2. Analyser la politique corrigée localement

```bash
cloudsplaining scan-policy-file \
  --input-file politiques/corrected-policy.json \
  > rapports/cloudsplaining-local/corrected-policy-cloudsplaining.txt

cat rapports/cloudsplaining-local/corrected-policy-cloudsplaining.txt
```

Comparer les deux rapports :

```bash
diff -u \
  rapports/cloudsplaining-local/weak-policy-cloudsplaining.txt \
  rapports/cloudsplaining-local/corrected-policy-cloudsplaining.txt
```

Analyse attendue :

| Élément | Avant correction | Après correction |
|---|---|---|
| Escalade par version de politique | Possible | Corrigée |
| `iam:CreatePolicyVersion` | Présent | Absent |
| `iam:SetDefaultPolicyVersion` | Présent | Absent |
| Actions IAM avec joker | Présentes | Réduites |
| Risque IAM global | Élevé | Réduit |

## 5.3. Analyser le compte AWS avec Cloudsplaining

Télécharger les informations IAM du compte :

```bash
cloudsplaining download \
  --profile default \
  --output rapports/cloudsplaining-compte/
```

> **Note** : Cloudsplaining génère automatiquement un fichier nommé d'après l'Account ID, par exemple `123456789012.json`. Le nom exact dépend de la version de l'outil.

Identifier le fichier généré :

```bash
ls -lh rapports/cloudsplaining-compte/
FICHIER_AUTH=$(ls rapports/cloudsplaining-compte/*.json | head -1)
echo "$FICHIER_AUTH"
```

Lancer l'analyse :

```bash
cloudsplaining scan \
  --input-file "$FICHIER_AUTH" \
  --output rapports/cloudsplaining-compte/report
```

Lister les rapports générés :

```bash
find rapports/cloudsplaining-compte -maxdepth 2 -type f
```

Analyse attendue :

| Élément | Résultat attendu |
|---|---|
| Identité concernée | `dev-audit-user` |
| Politique concernée | `AuditWeakPolicy` |
| Permission critique 1 | `iam:CreatePolicyVersion` |
| Permission critique 2 | `iam:SetDefaultPolicyVersion` |
| Type de risque | Escalade de privilèges |
| Cause racine | Droits de gestion des versions de politiques trop larges |
| Correction attendue | Suppression des deux permissions sensibles |

---

## Étape 6 : Analyse avec PMapper

> **Note sur la syntaxe** : le flag `--profile` se place toujours immédiatement après `pmapper`, avant le sous-groupe de commandes. Les commandes `graph list` et `graph display` utilisent le graphe déjà construit localement et ne nécessitent pas de profil AWS actif.

## 6.1. Créer le graphe IAM

```bash
pmapper --profile default graph create \
  | tee rapports/pmapper/01-graph-create.txt
```

Lister les graphes disponibles :

```bash
pmapper graph list \
  | tee rapports/pmapper/02-graph-list.txt
```

Afficher les informations du graphe :

```bash
pmapper graph display \
  | tee rapports/pmapper/03-graph-display.txt
```

## 6.2. Rechercher les permissions sensibles

Identifier qui peut créer une version de politique :

```bash
pmapper --profile default query 'who can do iam:CreatePolicyVersion' \
  | tee rapports/pmapper/04-who-can-create-policy-version.txt
```

Identifier qui peut définir une version de politique par défaut :

```bash
pmapper --profile default query 'who can do iam:SetDefaultPolicyVersion' \
  | tee rapports/pmapper/05-who-can-set-default-policy-version.txt
```

Lancer une recherche de chemins d'escalade :

```bash
pmapper --profile default query 'preset privesc *' \
  | tee rapports/pmapper/06-preset-privesc.txt
```

Consulter les rapports :

```bash
cat rapports/pmapper/04-who-can-create-policy-version.txt
cat rapports/pmapper/05-who-can-set-default-policy-version.txt
cat rapports/pmapper/06-preset-privesc.txt
```

Analyse attendue :

| Requête PMapper | Résultat attendu | Interprétation |
|---|---|---|
| `who can do iam:CreatePolicyVersion` | `dev-audit-user` apparaît dans les résultats | L'identité peut créer une version de politique |
| `who can do iam:SetDefaultPolicyVersion` | `dev-audit-user` apparaît dans les résultats | L'identité peut activer une version de politique |
| `preset privesc *` | La sortie peut varier selon la version de PMapper | À croiser avec les requêtes ciblées ci-dessus |

`dev-audit-user` ne possède pas directement `AdministratorAccess`. La combinaison de `iam:CreatePolicyVersion` et `iam:SetDefaultPolicyVersion` constitue une escalade indirecte : l'identité peut créer une version plus permissive d'une politique existante et l'activer.

---

## Étape 7 : Analyse du chemin d'escalade

Le chemin d'escalade étudié est le suivant :

```text
dev-audit-user
  -> AuditWeakPolicy
  -> iam:CreatePolicyVersion
     -> création possible d'une version de politique plus permissive
  -> iam:SetDefaultPolicyVersion
     -> activation possible de cette version
  -> élévation indirecte de privilèges
```

Analyse attendue :

| Élément | Valeur |
|---|---|
| Identité initiale | `dev-audit-user` |
| Politique attachée | `AuditWeakPolicy` |
| Permission critique 1 | `iam:CreatePolicyVersion` |
| Permission critique 2 | `iam:SetDefaultPolicyVersion` |
| Ressource ciblée | `*` |
| Condition de sécurité | Aucune |
| Impact potentiel | Augmentation indirecte du niveau de privilège |
| Cause racine | Permissions IAM de modification accordées à un utilisateur d'audit |

## 7.1. Visualiser l'impact potentiel

```bash
cat politiques/privilege-simulation-policy.json
```

Cette politique contient `"Action": "*"` sur `"Resource": "*"`. Elle représente un impact administrateur complet et illustre le niveau de risque si une telle version était créée puis activée sur `AuditWeakPolicy`. Elle n'est **pas** déployée dans AWS.

---

## Étape 8 : Remédiation

## 8.1. Comparer les deux politiques

```bash
diff -u politiques/weak-policy.json politiques/corrected-policy.json
```

Analyse attendue :

| Élément | Politique vulnérable | Politique corrigée |
|---|---|---|
| `iam:CreatePolicyVersion` | Présent | Absent |
| `iam:SetDefaultPolicyVersion` | Présent | Absent |
| `iam:Get*` | Présent | Absent |
| `iam:List*` | Présent | Absent |
| Actions de lecture IAM | Larges (jokers) | Explicites |
| Chemin d'escalade | Présent | Supprimé |

## 8.2. Créer une nouvelle version corrigée de la politique AWS

```bash
aws iam create-policy-version \
  --policy-arn "$ARN_POLITIQUE" \
  --policy-document file://politiques/corrected-policy.json \
  --set-as-default \
  --profile default
```

## 8.3. Vérifier les versions de la politique

```bash
aws iam list-policy-versions \
  --policy-arn "$ARN_POLITIQUE" \
  --profile default
```

## 8.4. Récupérer et afficher la version active

```bash
VERSION_ACTIVE=$(aws iam get-policy \
  --policy-arn "$ARN_POLITIQUE" \
  --profile default \
  --query 'Policy.DefaultVersionId' \
  --output text)
echo "$VERSION_ACTIVE"
```

```bash
aws iam get-policy-version \
  --policy-arn "$ARN_POLITIQUE" \
  --version-id "$VERSION_ACTIVE" \
  --profile default
```

---

## Étape 9 : Vérification après correction

## 9.1. Vérifier avec Cloudsplaining

Télécharger à nouveau les informations IAM :

```bash
cloudsplaining download \
  --profile default \
  --output rapports/cloudsplaining-compte/

FICHIER_AUTH_APRES=$(ls rapports/cloudsplaining-compte/*.json | head -1)
```

Relancer l'analyse :

```bash
cloudsplaining scan \
  --input-file "$FICHIER_AUTH_APRES" \
  --output rapports/cloudsplaining-compte/report-after-remediation
```

Lister les rapports :

```bash
find rapports/cloudsplaining-compte -maxdepth 2 -type f
```

Analyse attendue :

| Élément | Avant correction | Après correction |
|---|---|---|
| `iam:CreatePolicyVersion` | Présent | Absent |
| `iam:SetDefaultPolicyVersion` | Présent | Absent |
| Risque d'escalade IAM | Présent | Réduit |
| Qualité de la politique | Faible | Améliorée |

## 9.2. Vérifier avec PMapper

Reconstruire le graphe :

```bash
pmapper --profile default graph create \
  | tee rapports/pmapper/07-graph-create-after-remediation.txt
```

Relancer les requêtes ciblées :

```bash
pmapper --profile default query 'who can do iam:CreatePolicyVersion' \
  | tee rapports/pmapper/08-who-can-create-policy-version-after-remediation.txt

pmapper --profile default query 'who can do iam:SetDefaultPolicyVersion' \
  | tee rapports/pmapper/09-who-can-set-default-policy-version-after-remediation.txt

pmapper --profile default query 'preset privesc *' \
  | tee rapports/pmapper/10-preset-privesc-after-remediation.txt
```

Consulter les résultats :

```bash
cat rapports/pmapper/08-who-can-create-policy-version-after-remediation.txt
cat rapports/pmapper/09-who-can-set-default-policy-version-after-remediation.txt
cat rapports/pmapper/10-preset-privesc-after-remediation.txt
```

Analyse attendue :

| Requête | Avant correction | Après correction |
|---|---|---|
| `who can do iam:CreatePolicyVersion` | `dev-audit-user` présent | `dev-audit-user` absent |
| `who can do iam:SetDefaultPolicyVersion` | `dev-audit-user` présent | `dev-audit-user` absent |
| `preset privesc *` | Risque potentiel présent | Chemin supprimé ou réduit |

---

## Étape 10 : Nettoyage

## 10.1. Supprimer la clé d'accès de l'utilisateur

Récupérer l'identifiant de la clé :

```bash
CLE_ACCES_A_SUPPRIMER=$(aws iam list-access-keys \
  --user-name "$UTILISATEUR_LAB" \
  --profile default \
  --query 'AccessKeyMetadata[0].AccessKeyId' \
  --output text)
echo "$CLE_ACCES_A_SUPPRIMER"
```

Supprimer la clé :

```bash
aws iam delete-access-key \
  --user-name "$UTILISATEUR_LAB" \
  --access-key-id "$CLE_ACCES_A_SUPPRIMER" \
  --profile default
```

## 10.2. Détacher la politique de l'utilisateur

```bash
aws iam detach-user-policy \
  --user-name "$UTILISATEUR_LAB" \
  --policy-arn "$ARN_POLITIQUE" \
  --profile default
```

## 10.3. Supprimer les versions non actives de la politique

AWS impose de supprimer toutes les versions non actives avant de pouvoir supprimer une politique.

Supprimer toutes les versions non actives en une seule boucle :

```bash
aws iam list-policy-versions \
  --policy-arn "$ARN_POLITIQUE" \
  --profile default \
  --query 'Versions[?IsDefaultVersion==`false`].VersionId' \
  --output text \
| tr '\t' '\n' \
| while read -r VERSION_ID; do
    echo "Suppression de la version $VERSION_ID"
    aws iam delete-policy-version \
      --policy-arn "$ARN_POLITIQUE" \
      --version-id "$VERSION_ID" \
      --profile default
  done
```

Vérifier qu'il ne reste qu'une seule version (la version active) :

```bash
aws iam list-policy-versions \
  --policy-arn "$ARN_POLITIQUE" \
  --profile default
```

## 10.4. Supprimer la politique

```bash
aws iam delete-policy \
  --policy-arn "$ARN_POLITIQUE" \
  --profile default
```

## 10.5. Supprimer l'utilisateur IAM

```bash
aws iam delete-user \
  --user-name "$UTILISATEUR_LAB" \
  --profile default
```

## 10.6. Supprimer le profil AWS CLI local

`aws configure unset` laisse une section vide dans les fichiers de configuration. Supprimer manuellement les entrées du profil `iam-lab-user` :

```bash
# Linux/macOS
sed -i "/^\[profile $PROFIL_TEST\]/,/^\[/{ /^\[profile $PROFIL_TEST\]/d; /^\[/!d }" ~/.aws/config
sed -i "/^\[$PROFIL_TEST\]/,/^\[/{ /^\[$PROFIL_TEST\]/d; /^\[/!d }" ~/.aws/credentials
```

Ou supprimer manuellement les blocs correspondants dans `~/.aws/config` et `~/.aws/credentials`.

## 10.7. Vérifier que l'utilisateur a bien été supprimé

```bash
aws iam get-user \
  --user-name "$UTILISATEUR_LAB" \
  --profile default
```

La commande doit retourner une erreur `NoSuchEntity`.

---

## Repères formateur

## 11.1. Résultat attendu avec Cloudsplaining

Cloudsplaining doit faire apparaître un risque d'escalade de privilèges lié aux permissions suivantes :

```text
iam:CreatePolicyVersion
iam:SetDefaultPolicyVersion
```

Le risque est renforcé par `Resource: "*"` et l'absence de condition. La recommandation attendue est le retrait de ces permissions pour `dev-audit-user`.

## 11.2. Résultat attendu avec PMapper

Les requêtes ciblées constituent la vérification principale :

```bash
pmapper --profile default query 'who can do iam:CreatePolicyVersion'
pmapper --profile default query 'who can do iam:SetDefaultPolicyVersion'
```

`preset privesc *` peut varier selon la version de PMapper et le contenu du graphe. L'analyse doit donc croiser les deux approches.

## 11.3. Chemin d'escalade attendu

```text
dev-audit-user
  -> AuditWeakPolicy
  -> iam:CreatePolicyVersion
     -> création possible d'une version de politique plus permissive
  -> iam:SetDefaultPolicyVersion
     -> activation possible de cette version
  -> élévation indirecte de privilèges
```

## 11.4. Remédiation attendue

Permissions à retirer :

```text
iam:CreatePolicyVersion
iam:SetDefaultPolicyVersion
```

Permissions à remplacer par une liste explicite :

```text
iam:Get*  →  iam:GetUser, iam:GetRole, iam:GetPolicy, iam:GetPolicyVersion
iam:List* →  iam:ListUsers, iam:ListRoles, iam:ListPolicies, ...
```

Après correction, `dev-audit-user` conserve une capacité de découverte IAM limitée mais ne peut plus créer ni activer une nouvelle version de politique.

## 11.5. Synthèse attendue

L'identité `dev-audit-user` n'est pas administratrice directement. Elle dispose cependant d'une combinaison de permissions lui permettant potentiellement de modifier son niveau de privilège effectif via la gestion des versions de politiques IAM.

La correction consiste à retirer les permissions de modification et à limiter les droits IAM au besoin réel d'audit.
