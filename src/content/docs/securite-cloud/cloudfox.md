---
title: "TP : Cartographie sécurité AWS avec CloudFox"
description: Réaliser une cartographie sécurité offensive contrôlée d'un compte AWS avec CloudFox — inventaire des services, analyse IAM, relations de confiance, permissions sensibles et buckets S3.
---

## Outil

CloudFox

## Objectif

Ce TP permet de réaliser une cartographie sécurité d'un compte AWS avec CloudFox.

L'apprenant va :

1. installer CloudFox ;
2. préparer un profil AWS dédié à l'analyse ;
3. vérifier l'identité utilisée ;
4. inventorier les services visibles dans le compte ;
5. lister les identités IAM ;
6. analyser les permissions IAM ;
7. identifier les relations de confiance entre rôles ;
8. rechercher les permissions sensibles ;
9. analyser les buckets S3 visibles ;
10. exploiter les fichiers de sortie générés par CloudFox ;
11. nettoyer les ressources IAM créées pour le TP.

CloudFox est utilisé ici pour obtenir une vue de situation rapide d'un compte AWS, sans déployer d'application.

## Sources

| Sujet | Source |
|---|---|
| CloudFox | https://github.com/BishopFox/cloudfox |
| Commandes AWS CloudFox | https://github.com/BishopFox/cloudfox/wiki/AWS-Commands |
| Bonnes pratiques IAM AWS | https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html |
| AWS CLI | https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html |

## Durée indicative

| Séquence | Durée |
|---|---:|
| Préparation locale | 15 min |
| Installation de CloudFox | 15 min |
| Création du profil d'analyse | 25 min |
| Inventaire du compte | 30 min |
| Analyse IAM | 45 min |
| Analyse S3 | 25 min |
| Analyse des sorties CloudFox | 35 min |
| Nettoyage | 15 min |
| Total | 3 h 25 |

## Compétences travaillées

| Compétence | Niveau attendu |
|---|---|
| Installer et utiliser CloudFox | Débutant à intermédiaire |
| Comprendre une cartographie AWS | Intermédiaire |
| Identifier les identités IAM | Intermédiaire |
| Lire les permissions IAM attribuées | Intermédiaire |
| Comprendre les relations de confiance IAM | Intermédiaire |
| Identifier des permissions sensibles | Intermédiaire |
| Lire les fichiers de sortie d'un outil d'audit | Intermédiaire |
| Nettoyer les ressources IAM temporaires | Débutant |

## Scénario

Une équipe sécurité souhaite obtenir une première vision offensive contrôlée d'un compte AWS.

L'objectif n'est pas de corriger immédiatement tous les constats, mais de comprendre :

```text
quels services sont visibles
quelles identités IAM existent
quelles permissions sont attribuées
quels rôles font confiance à quelles identités
quels buckets S3 sont visibles
quelles permissions sensibles peuvent être exercées
quels fichiers de sortie CloudFox sont utiles pour l'analyse
```

Le TP se concentre sur la cartographie et l'analyse.

## Logique du TP

| Étape | Objectif |
|---|---|
| Préparer l'environnement | Créer les dossiers de travail |
| Installer CloudFox | Disposer de l'outil d'analyse |
| Créer un profil AWS dédié | Séparer l'administration du compte et l'analyse |
| Lancer l'inventaire | Identifier les régions et services visibles |
| Lister les identités | Repérer utilisateurs et rôles IAM |
| Lire les permissions | Comprendre les droits attribués |
| Analyser les rôles | Identifier les relations de confiance |
| Rechercher les permissions sensibles | Repérer les capacités à risque |
| Lire les sorties CloudFox | Exploiter tableaux, CSV et fichiers de commandes |
| Nettoyer | Supprimer les ressources IAM temporaires |

---

## 1. Préparation de l'environnement

### 1.1. Créer le répertoire de travail

```bash
mkdir -p tp-cloudfox-aws
cd tp-cloudfox-aws
mkdir -p rapports/cloudfox rapports/aws politiques notes
```

### 1.2. Créer un `.gitignore`

> Les clés d'accès AWS ne doivent jamais être versionnées, même dans un dépôt privé.

```bash
cat > .gitignore <<'EOF'
rapports/aws/
notes/
EOF
```

### 1.3. Vérifier AWS CLI et l'identité d'administration

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

Le profil `default` est utilisé pour créer le profil d'analyse dédié, puis pour le supprimer à la fin du TP.

---

## 2. Installation de CloudFox

### 2.1. Installer CloudFox

**macOS ou Linux avec Homebrew :**

```bash
brew install cloudfox
```

**Linux (binaire GitHub Releases) :**

```bash
CLOUDFOX_VERSION=$(curl -s https://api.github.com/repos/BishopFox/cloudfox/releases/latest \
  | grep tag_name | cut -d '"' -f4 | sed 's/v//')
curl -sSL "https://github.com/BishopFox/cloudfox/releases/download/v${CLOUDFOX_VERSION}/cloudfox-linux-amd64.tar.gz" \
  | tar -xz -C /usr/local/bin cloudfox
chmod +x /usr/local/bin/cloudfox
```

**Avec Go :**

```bash
go install github.com/BishopFox/cloudfox@latest
```

### 2.2. Vérifier l'installation

```bash
cloudfox --version
cloudfox --help
cloudfox aws --help
```

---

## 3. Création d'un profil AWS dédié à l'analyse

### 3.1. Définir les variables du TP

```bash
PROFIL_ADMIN="default"
PROFIL_AUDIT="cloudfox-audit"
UTILISATEUR_AUDIT="cloudfox-audit-user"
REGION_AWS="eu-west-1"

ID_COMPTE=$(aws sts get-caller-identity \
  --profile "$PROFIL_ADMIN" \
  --query Account \
  --output text)

echo "$PROFIL_ADMIN"
echo "$PROFIL_AUDIT"
echo "$UTILISATEUR_AUDIT"
echo "$REGION_AWS"
echo "$ID_COMPTE"
```

### 3.2. Créer l'utilisateur IAM d'analyse

```bash
aws iam create-user \
  --user-name "$UTILISATEUR_AUDIT" \
  --profile "$PROFIL_ADMIN"
```

### 3.3. Attacher les politiques AWS managées

```bash
aws iam attach-user-policy \
  --user-name "$UTILISATEUR_AUDIT" \
  --policy-arn arn:aws:iam::aws:policy/SecurityAudit \
  --profile "$PROFIL_ADMIN"

aws iam attach-user-policy \
  --user-name "$UTILISATEUR_AUDIT" \
  --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess \
  --profile "$PROFIL_ADMIN"
```

### 3.4. Créer une politique complémentaire pour la simulation IAM

```bash
cat > politiques/cloudfox-iam-simulation-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowIamPolicySimulationForCloudFox",
      "Effect": "Allow",
      "Action": [
        "iam:SimulatePrincipalPolicy",
        "iam:SimulateCustomPolicy",
        "iam:GetContextKeysForPrincipalPolicy",
        "iam:GetContextKeysForCustomPolicy"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name CloudFoxIamSimulationPolicy \
  --policy-document file://politiques/cloudfox-iam-simulation-policy.json \
  --profile "$PROFIL_ADMIN"

ARN_POLITIQUE_SIMULATION="arn:aws:iam::$ID_COMPTE:policy/CloudFoxIamSimulationPolicy"
echo "$ARN_POLITIQUE_SIMULATION"

aws iam attach-user-policy \
  --user-name "$UTILISATEUR_AUDIT" \
  --policy-arn "$ARN_POLITIQUE_SIMULATION" \
  --profile "$PROFIL_ADMIN"
```

### 3.5. Créer une clé d'accès pour le profil d'analyse

> **Sécurité** : les clés d'accès sont des secrets. On les lit directement dans des variables shell sans les écrire sur disque.

```bash
CREDS=$(aws iam create-access-key \
  --user-name "$UTILISATEUR_AUDIT" \
  --profile "$PROFIL_ADMIN")

ACCESS_KEY_ID=$(echo "$CREDS" | python3 -c "import sys,json; print(json.load(sys.stdin)['AccessKey']['AccessKeyId'])")
SECRET_ACCESS_KEY=$(echo "$CREDS" | python3 -c "import sys,json; print(json.load(sys.stdin)['AccessKey']['SecretAccessKey'])")

echo "Access Key ID : $ACCESS_KEY_ID"
```

### 3.6. Configurer le profil AWS CLI d'analyse

```bash
aws configure set aws_access_key_id     "$ACCESS_KEY_ID"     --profile "$PROFIL_AUDIT"
aws configure set aws_secret_access_key "$SECRET_ACCESS_KEY" --profile "$PROFIL_AUDIT"
aws configure set region                "$REGION_AWS"        --profile "$PROFIL_AUDIT"
```

### 3.7. Vérifier l'identité du profil d'analyse

```bash
aws sts get-caller-identity --profile "$PROFIL_AUDIT"
```

La sortie doit contenir l'ARN de `cloudfox-audit-user`.

### 3.8. Localiser le dossier de sortie CloudFox

CloudFox écrit ses résultats par défaut dans `~/.cloudfox/cloudfox-output/<account-id>/`. Définir cette variable pour référencer les fichiers générés dans la suite du TP :

```bash
CLOUDFOX_OUTPUT="$HOME/.cloudfox/cloudfox-output/$ID_COMPTE"
echo "$CLOUDFOX_OUTPUT"
```

---

## 4. Première vérification CloudFox

### 4.1. Lancer une commande simple

```bash
cloudfox aws --profile "$PROFIL_AUDIT" inventory -v2 \
  | tee rapports/cloudfox/01-inventory-terminal.txt
```

### 4.2. Vérifier le dossier de sortie

```bash
ls -lh "$CLOUDFOX_OUTPUT" 2>/dev/null || echo "Dossier CloudFox non encore créé"
```

CloudFox génère des fichiers exploitables en plus de l'affichage terminal. Les sorties incluent des tableaux, des CSV et des fichiers de commandes utiles pour poursuivre l'analyse.

---

## 5. Inventaire du compte AWS

### 5.1. Lancer l'inventaire

```bash
cloudfox aws --profile "$PROFIL_AUDIT" inventory -v2 \
  | tee rapports/cloudfox/02-inventory.txt

cat rapports/cloudfox/02-inventory.txt
```

### 5.2. Points d'observation

| Élément | Question à se poser |
|---|---|
| Régions actives | Le compte utilise-t-il plusieurs régions ? |
| Services visibles | Quels services semblent réellement utilisés ? |
| Ressources IAM | Le compte contient-il beaucoup d'identités ? |
| S3 | Des buckets existent-ils ? |
| Lambda | Des fonctions existent-elles ? |
| EC2 | Des instances existent-elles ? |
| RDS | Des bases de données existent-elles ? |

---

## 6. Analyse des identités IAM

### 6.1. Lister les identités IAM

```bash
cloudfox aws --profile "$PROFIL_AUDIT" principals -v2 \
  | tee rapports/cloudfox/03-principals.txt

cat rapports/cloudfox/03-principals.txt
```

### 6.2. Questions d'analyse

| Question | Ce qu'il faut observer |
|---|---|
| Beaucoup d'utilisateurs IAM ? | Usage potentiellement historique ou manuel |
| Beaucoup de rôles ? | Normal dans AWS, mais à analyser |
| Des rôles semblent-ils administrateurs ? | Noms : Admin, Administrator, OrganizationAccountAccessRole |
| Des rôles semblent-ils liés à CI/CD ? | Noms : deploy, pipeline, github, gitlab, ci |
| Des rôles semblent-ils liés à des services ? | Lambda, EC2, ECS, CodeBuild |

---

## 7. Analyse des permissions IAM

### 7.1. Lancer l'analyse des permissions

```bash
cloudfox aws --profile "$PROFIL_AUDIT" permissions -v2 \
  | tee rapports/cloudfox/04-permissions.txt

cat rapports/cloudfox/04-permissions.txt
```

### 7.2. Rechercher les éléments sensibles

```bash
grep -i "administrator"       rapports/cloudfox/04-permissions.txt
grep -E "\*|:\*"              rapports/cloudfox/04-permissions.txt | head -n 50
grep -i "iam:"                rapports/cloudfox/04-permissions.txt | head -n 50
grep -i "sts:"                rapports/cloudfox/04-permissions.txt | head -n 50
grep -i "s3:"                 rapports/cloudfox/04-permissions.txt | head -n 50
grep -i "secretsmanager:"     rapports/cloudfox/04-permissions.txt | head -n 50
grep -i "ssm:"                rapports/cloudfox/04-permissions.txt | head -n 50
```

### 7.3. Permissions à surveiller en priorité

```text
AdministratorAccess
iam:PassRole
sts:AssumeRole
iam:CreatePolicyVersion
iam:SetDefaultPolicyVersion
iam:AttachUserPolicy / iam:AttachRolePolicy
iam:PutUserPolicy / iam:PutRolePolicy
lambda:UpdateFunctionCode / lambda:CreateFunction
ec2:RunInstances
ssm:StartSession / ssm:SendCommand
secretsmanager:GetSecretValue
s3:GetObject / s3:PutBucketPolicy
```

Les permissions IAM ne doivent pas être lues uniquement ligne par ligne. Il faut chercher les combinaisons dangereuses. Une identité peut être risquée sans avoir directement `AdministratorAccess`.

---

## 8. Analyse des relations de confiance IAM

### 8.1. Lancer l'analyse des relations de confiance

```bash
cloudfox aws --profile "$PROFIL_AUDIT" role-trusts -v2 \
  | tee rapports/cloudfox/05-role-trusts.txt

cat rapports/cloudfox/05-role-trusts.txt
```

### 8.2. Rechercher les relations de confiance larges

```bash
grep -i ":root"      rapports/cloudfox/05-role-trusts.txt
grep -i "ExternalID" rapports/cloudfox/05-role-trusts.txt
grep -i "YES"        rapports/cloudfox/05-role-trusts.txt
```

### 8.3. Éléments à observer

```text
rôles qui font confiance à un compte entier
rôles qui font confiance à une identité précise
rôles qui font confiance à un fournisseur fédéré
présence ou absence d'ExternalId
rôles pouvant mener à des droits administratifs
```

Une relation de confiance IAM ne donne pas toujours accès à elle seule. Elle doit être croisée avec les permissions `sts:AssumeRole` du principal concerné.

---

## 9. Recherche de permissions sensibles avec le simulateur IAM

> **Note sur la durée** : `iam-simulator` sans `--principal` scanne toutes les identités du compte, ce qui peut être long (plusieurs minutes) sur un compte peuplé. Pour cibler une identité précise, ajouter `--principal arn:aws:iam::<ACCOUNT_ID>:user/<NOM>`. Les commandes ci-dessous scannent l'ensemble du compte — adapter si nécessaire.

### 9.1. Rechercher qui peut faire `iam:PassRole`

```bash
cloudfox aws --profile "$PROFIL_AUDIT" iam-simulator -v2 --action iam:PassRole \
  | tee rapports/cloudfox/06-simulate-iam-passrole.txt
```

### 9.2. Rechercher qui peut faire `sts:AssumeRole`

```bash
cloudfox aws --profile "$PROFIL_AUDIT" iam-simulator -v2 --action sts:AssumeRole \
  | tee rapports/cloudfox/07-simulate-sts-assumerole.txt
```

### 9.3. Rechercher qui peut lire des objets S3

```bash
cloudfox aws --profile "$PROFIL_AUDIT" iam-simulator -v2 --action s3:GetObject \
  | tee rapports/cloudfox/08-simulate-s3-getobject.txt
```

### 9.4. Rechercher qui peut lire des secrets

```bash
cloudfox aws --profile "$PROFIL_AUDIT" iam-simulator -v2 --action secretsmanager:GetSecretValue \
  | tee rapports/cloudfox/09-simulate-secretsmanager-getsecretvalue.txt
```

### 9.5. Rechercher qui peut ouvrir une session SSM

```bash
cloudfox aws --profile "$PROFIL_AUDIT" iam-simulator -v2 --action ssm:StartSession \
  | tee rapports/cloudfox/10-simulate-ssm-startsession.txt
```

### 9.6. Pourquoi ces permissions sont sensibles

| Permission | Raison |
|---|---|
| `iam:PassRole` | Peut permettre de transmettre un rôle puissant à un service AWS |
| `sts:AssumeRole` | Peut permettre d'endosser une autre identité |
| `s3:GetObject` | Peut donner accès à des données |
| `secretsmanager:GetSecretValue` | Peut exposer des secrets applicatifs |
| `ssm:StartSession` | Peut donner un accès interactif à des instances gérées |
| `iam:CreatePolicyVersion` | Peut participer à une escalade de privilèges |
| `iam:SetDefaultPolicyVersion` | Peut activer une politique plus permissive |

---

## 10. Analyse des buckets S3 visibles

### 10.1. Lister les buckets avec CloudFox

```bash
cloudfox aws --profile "$PROFIL_AUDIT" buckets -v2 \
  | tee rapports/cloudfox/11-buckets.txt

cat rapports/cloudfox/11-buckets.txt
```

### 10.2. Rechercher les fichiers de commandes générés

```bash
find "$CLOUDFOX_OUTPUT" -name "*bucket*" -type f 2>/dev/null
```

### 10.3. Points d'attention

```text
Un bucket privé peut rester intéressant dans une analyse de chemin d'attaque.
Le risque dépend des permissions réelles de lecture et d'écriture.
Un nom de bucket peut révéler une information métier, technique ou environnementale.
Les commandes de téléchargement générées par CloudFox ne doivent pas être exécutées sans compréhension de leur effet.
```

---

## 11. Analyse des sorties générées par CloudFox

### 11.1. Lister tous les fichiers générés

```bash
find "$CLOUDFOX_OUTPUT" -type f 2>/dev/null \
  | tee rapports/cloudfox/12-fichiers-sortie-cloudfox.txt

find "$CLOUDFOX_OUTPUT" -name "*.csv" -type f 2>/dev/null \
  | tee rapports/cloudfox/13-fichiers-csv.txt

find "$CLOUDFOX_OUTPUT" -path "*loot*" -type f 2>/dev/null \
  | tee rapports/cloudfox/15-fichiers-loot.txt
```

### 11.2. Lire le fichier CSV des permissions

Capturer le chemin dans une variable pour éviter la substitution manuelle :

```bash
FICHIER_PERMISSIONS_CSV=$(find "$CLOUDFOX_OUTPUT" -name "*permissions*.csv" -type f 2>/dev/null | head -1)
echo "$FICHIER_PERMISSIONS_CSV"

if [ -n "$FICHIER_PERMISSIONS_CSV" ]; then
  head -n 20 "$FICHIER_PERMISSIONS_CSV"
else
  echo "Fichier non trouvé — vérifier le dossier $CLOUDFOX_OUTPUT"
fi
```

### 11.3. Lire le fichier CSV des relations de confiance

```bash
FICHIER_ROLE_TRUSTS_CSV=$(find "$CLOUDFOX_OUTPUT" -name "*role-trusts*.csv" -type f 2>/dev/null | head -1)
echo "$FICHIER_ROLE_TRUSTS_CSV"

if [ -n "$FICHIER_ROLE_TRUSTS_CSV" ]; then
  head -n 20 "$FICHIER_ROLE_TRUSTS_CSV"
else
  echo "Fichier non trouvé — vérifier le dossier $CLOUDFOX_OUTPUT"
fi
```

### 11.4. Interprétation attendue

```text
Les fichiers CSV permettent de filtrer, trier et croiser les résultats hors terminal.
Les fichiers de type loot contiennent souvent des commandes de poursuite d'analyse.
Ces commandes ne doivent pas être exécutées automatiquement sans compréhension de leur effet.
```

---

## 12. Synthèse locale de l'analyse

```bash
cat > notes/synthese-cloudfox.md <<'EOF'
# Synthèse CloudFox

## Objectif

Obtenir une vue de situation d'un compte AWS à partir d'un profil d'audit.

## Commandes exécutées

- inventory
- principals
- permissions
- role-trusts
- iam-simulator
- buckets

## Permissions sensibles à prioriser

- iam:PassRole
- sts:AssumeRole
- iam:CreatePolicyVersion
- iam:SetDefaultPolicyVersion
- secretsmanager:GetSecretValue
- ssm:StartSession
- s3:GetObject
- lambda:UpdateFunctionCode
- ec2:RunInstances

## Analyse attendue

Une identité peut être risquée même sans permission administrateur directe.
Les risques apparaissent souvent par combinaison : permission IAM sensible, relation de confiance large, accès à des secrets, capacité à agir via un service AWS.

## Limites

CloudFox fournit une cartographie utile, mais les résultats doivent être interprétés dans le contexte réel du compte, croisés avec les politiques IAM, les ressources réellement présentes, les exigences métier et les journaux d'usage.
EOF

cat notes/synthese-cloudfox.md
```

---

## 13. Nettoyage des ressources IAM du TP

### 13.1. Supprimer la clé d'accès

```bash
CLE_ACCES_A_SUPPRIMER=$(aws iam list-access-keys \
  --user-name "$UTILISATEUR_AUDIT" \
  --profile "$PROFIL_ADMIN" \
  --query 'AccessKeyMetadata[0].AccessKeyId' \
  --output text)

echo "$CLE_ACCES_A_SUPPRIMER"

aws iam delete-access-key \
  --user-name "$UTILISATEUR_AUDIT" \
  --access-key-id "$CLE_ACCES_A_SUPPRIMER" \
  --profile "$PROFIL_ADMIN"
```

### 13.2. Détacher et supprimer les politiques

```bash
aws iam detach-user-policy \
  --user-name "$UTILISATEUR_AUDIT" \
  --policy-arn arn:aws:iam::aws:policy/SecurityAudit \
  --profile "$PROFIL_ADMIN"

aws iam detach-user-policy \
  --user-name "$UTILISATEUR_AUDIT" \
  --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess \
  --profile "$PROFIL_ADMIN"

aws iam detach-user-policy \
  --user-name "$UTILISATEUR_AUDIT" \
  --policy-arn "$ARN_POLITIQUE_SIMULATION" \
  --profile "$PROFIL_ADMIN"

aws iam delete-policy \
  --policy-arn "$ARN_POLITIQUE_SIMULATION" \
  --profile "$PROFIL_ADMIN"
```

### 13.3. Supprimer l'utilisateur IAM

```bash
aws iam delete-user \
  --user-name "$UTILISATEUR_AUDIT" \
  --profile "$PROFIL_ADMIN"
```

### 13.4. Vérifier la suppression

```bash
aws iam get-user \
  --user-name "$UTILISATEUR_AUDIT" \
  --profile "$PROFIL_ADMIN"
```

La commande doit retourner une erreur `NoSuchEntity`.

### 13.5. Supprimer le profil AWS CLI local

`aws configure unset` laisse des sections vides dans les fichiers de configuration. Supprimer les entrées proprement :

```bash
# Linux/macOS
sed -i "/^\[profile $PROFIL_AUDIT\]/,/^\[/{ /^\[profile $PROFIL_AUDIT\]/d; /^\[/!d }" ~/.aws/config
sed -i "/^\[$PROFIL_AUDIT\]/,/^\[/{ /^\[$PROFIL_AUDIT\]/d; /^\[/!d }" ~/.aws/credentials
```

Ou supprimer manuellement les blocs `[profile cloudfox-audit]` et `[cloudfox-audit]` dans `~/.aws/config` et `~/.aws/credentials`.

---

## 14. Nettoyage local

### 14.1. Supprimer les sorties CloudFox du TP

```bash
# Afficher ce qui va être supprimé
ls -lh "$CLOUDFOX_OUTPUT" 2>/dev/null

# Supprimer le dossier de sortie CloudFox pour ce compte
rm -rf "$CLOUDFOX_OUTPUT"
```

### 14.2. Supprimer les fichiers locaux du TP

```bash
rm -rf rapports notes politiques
cd ..
rm -rf tp-cloudfox-aws
```

---

## 15. Repères formateur

### 15.1. Résultat attendu

Le TP doit permettre de comprendre comment CloudFox aide à cartographier un compte AWS. Les résultats dépendent de l'état du compte — un compte presque vide produira peu de résultats.

### 15.2. Commandes CloudFox utilisées

```text
inventory       — régions et services visibles
principals      — utilisateurs et rôles IAM
permissions     — droits attribués
role-trusts     — relations de confiance entre rôles
iam-simulator   — qui peut exécuter une action donnée
buckets         — buckets S3 visibles
```

### 15.3. Points de vigilance

`iam-simulator` sans `--principal` peut être long sur un compte peuplé. Proposer de cibler une identité précise si la commande prend trop de temps.

Les fichiers de type `loot` générés par CloudFox contiennent des commandes prêtes à l'emploi. Expliquer explicitement aux apprenants qu'ils ne doivent pas les exécuter sans les comprendre.

Le dossier `~/.cloudfox/cloudfox-output/` persiste entre les sessions. Vérifier sa suppression en fin de TP.

### 15.4. Synthèse attendue

La sécurité AWS ne se limite pas à une liste de ressources. L'analyse doit croiser identités, permissions, relations de confiance, ressources visibles et chemins d'escalade potentiels. CloudFox fournit une vue offensive contrôlée qui aide à prioriser les investigations.
