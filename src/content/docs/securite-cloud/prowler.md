---
title: "TP : Inventaire sécurité AWS avec Prowler"
date: 2026-05-28
description: Réaliser un inventaire sécurité d'un compte AWS avec Prowler, ciblé sur IAM et les contrôles du compte.
---

## Objectif

Réaliser un inventaire sécurité d'un compte AWS avec Prowler, en se concentrant sur les contrôles liés au compte AWS, à IAM et aux bonnes pratiques de gouvernance des identités.

1. Préparer un environnement local
2. Installer Prowler
3. Vérifier l'identité AWS utilisée
4. Lancer une analyse ciblée IAM
5. Lancer une analyse ciblée sur les contrôles du compte AWS
6. Générer des rapports en plusieurs formats
7. Lire les constats principaux
8. Filtrer les résultats par statut et sévérité
9. Identifier les risques prioritaires
10. Appliquer des remédiations simples
11. Relancer l'analyse
12. Supprimer les fichiers générés

## Sources

| Sujet | Source |
|---|---|
| Prowler | https://github.com/prowler-cloud/prowler |
| Documentation Prowler | https://docs.prowler.com |
| Prowler AWS | https://docs.prowler.com/user-guide/providers/aws/getting-started-aws |
| AWS IAM | https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html |
| Bonnes pratiques IAM | https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html |
| AWS CLI | https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html |

## Durée estimée

| Séquence | Durée |
|---|---:|
| Préparation locale | 15 min |
| Installation de Prowler | 15 min |
| Vérification du contexte AWS | 10 min |
| Analyse IAM | 35 min |
| Analyse du compte AWS | 25 min |
| Lecture des rapports | 35 min |
| Filtrage des résultats | 30 min |
| Remédiations simples | 30 min |
| Nouvelle analyse | 20 min |
| Nettoyage | 10 min |
| **Total** | **3 h 45** |

## Compétences travaillées

| Compétence | Niveau attendu |
|---|---|
| Lancer un inventaire sécurité AWS | Débutant |
| Comprendre les constats Prowler | Intermédiaire |
| Identifier les risques IAM prioritaires | Intermédiaire |
| Lire un rapport JSON, CSV ou HTML | Intermédiaire |
| Filtrer des résultats de sécurité | Intermédiaire |
| Prioriser les constats | Intermédiaire |
| Appliquer une remédiation IAM simple | Intermédiaire |
| Comparer deux analyses de sécurité | Intermédiaire |

## Scénario

Une équipe sécurité souhaite obtenir une première photographie de la posture sécurité d'un compte AWS de test.

L'analyse se concentre sur les identités, les accès, les politiques IAM et les paramètres du compte.

```text
Quelles identités existent dans le compte ?
Existe-t-il des constats liés à l'authentification ?
Existe-t-il des constats liés aux clés d'accès ?
Existe-t-il des constats liés aux politiques IAM ?
Existe-t-il des constats liés au compte AWS lui-même ?
Quels constats doivent être priorisés ?
Quelles corrections simples peut-on appliquer rapidement ?
```

## Logique du TP

| Étape | Objectif |
|---|---|
| Préparer l'environnement | Créer les dossiers de travail |
| Installer Prowler | Disposer de l'outil d'analyse |
| Vérifier le compte AWS | Confirmer l'identité analysée |
| Lancer une analyse IAM | Identifier les risques liés aux identités |
| Lancer une analyse Account | Identifier les risques liés au compte |
| Générer des rapports | Produire des résultats exploitables |
| Filtrer les constats | Trier par statut, sévérité et service |
| Analyser les risques | Prioriser les constats |
| Appliquer des corrections simples | Corriger quelques paramètres IAM |
| Relancer l'analyse | Comparer avant et après |
| Nettoyer | Supprimer les fichiers locaux |

---

## Étape 1 : Préparation de l'environnement

### 1.1. Créer le répertoire de travail

```bash
mkdir -p tp-inventaire-securite-prowler
cd tp-inventaire-securite-prowler
mkdir -p rapports/iam rapports/account rapports/severite rapports/apres-correction/iam notes
```

### 1.2. Créer un environnement Python

```bash
python3 -m venv .venv
source .venv/bin/activate       # Linux/macOS
# ou
.\.venv\Scripts\Activate        # Windows PowerShell

python -m pip install --upgrade pip
```

### 1.3. Vérifier Python et pip

```bash
python --version
pip --version
```

---

## Étape 2 : Installation de Prowler

### 2.1. Installer Prowler

```bash
pip install prowler
```

### 2.2. Vérifier l'installation

```bash
prowler --version
prowler --help
prowler aws --help
```

---

## Étape 3 : Vérification du contexte AWS

### 3.1. Droits IAM requis pour Prowler

Prowler a besoin de droits en lecture large sur le compte pour exécuter ses contrôles. Le profil utilisé doit disposer au minimum de la politique AWS managée `SecurityAudit` ou `ReadOnlyAccess`.

Sans ces droits, les analyses peuvent échouer silencieusement ou produire des résultats partiels sans message d'erreur explicite.

Vérifier les politiques attachées au profil `default` :

```bash
NOM_UTILISATEUR=$(aws sts get-caller-identity \
  --profile default \
  --query 'Arn' \
  --output text | awk -F'/' '{print $NF}')

aws iam list-attached-user-policies \
  --user-name "$NOM_UTILISATEUR" \
  --profile default
```

### 3.2. Vérifier AWS CLI et l'identité AWS

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

### 3.3. Stocker l'identifiant du compte et les variables du TP

```bash
ID_COMPTE=$(aws sts get-caller-identity \
  --profile default \
  --query Account \
  --output text)

PROFIL_AWS="default"
REGION_AWS="eu-west-1"
DATE_ANALYSE=$(date +"%Y%m%d-%H%M%S")

echo "$ID_COMPTE"
echo "$PROFIL_AWS / $REGION_AWS / $DATE_ANALYSE"
```

---

## Étape 4 : Première analyse IAM

### 4.1. Lancer les contrôles IAM

```bash
prowler aws \
  --profile "$PROFIL_AWS" \
  --services iam \
  --output-directory rapports/iam \
  --output-formats json csv html
```

### 4.2. Lister les rapports IAM générés

```bash
find rapports/iam -type f
```

### 4.3. Ouvrir le rapport HTML IAM

```bash
# macOS
open "$(ls rapports/iam/*.html | head -1)"
# Linux
xdg-open "$(ls rapports/iam/*.html | head -1)"
```

Le rapport IAM présente les contrôles liés aux identités, aux utilisateurs, aux clés d'accès, à l'authentification, aux rôles, aux groupes et aux politiques IAM.

---

## Étape 5 : Analyse des résultats IAM

> **Note sur les `grep` CSV** : les commandes suivantes recherchent dans l'ensemble du fichier CSV. Un mot comme `FAIL` ou `mfa` peut apparaître dans plusieurs colonnes. Les comptages donnent une estimation du volume, pas un décompte exact par colonne. Pour une analyse précise, utiliser le rapport HTML ou ouvrir le CSV dans un tableur.

### 5.1. Lire l'en-tête du rapport CSV

```bash
head -n 1 "$(ls rapports/iam/*.csv | head -1)"
```

### 5.2. Compter les constats en échec et réussis

```bash
grep -i "FAIL" rapports/iam/*.csv | wc -l
grep -i "PASS" rapports/iam/*.csv | wc -l
```

### 5.3. Extraire les constats en échec

```bash
grep -i "FAIL" rapports/iam/*.csv > rapports/iam/iam-constats-echec.csv
head -n 20 rapports/iam/iam-constats-echec.csv
```

### 5.4. Rechercher des familles de constats

```bash
grep -i "mfa"    rapports/iam/*.csv | head -n 20
grep -i "access" rapports/iam/*.csv | head -n 20
grep -i "policy" rapports/iam/*.csv | head -n 20
grep -i "user"   rapports/iam/*.csv | head -n 20
```

### 5.5. Analyse attendue IAM

| Famille de constats | Risque associé | Exemple de remédiation |
|---|---|---|
| Identités sans MFA | Compromission plus simple | Activer MFA pour les identités humaines |
| Clés d'accès anciennes | Fuite ou usage non maîtrisé | Rotation ou suppression |
| Politiques trop permissives | Surprivilège | Réduire les droits accordés |
| Utilisateur racine | Risque critique en cas de compromission | Ne pas utiliser l'utilisateur racine au quotidien |
| Politique de mot de passe faible | Force brute ou réutilisation | Renforcer la politique de mot de passe |
| Permissions directement sur utilisateurs | Gouvernance difficile | Utiliser groupes ou rôles |

---

## Étape 6 : Analyse des contrôles du compte AWS

### 6.1. Lancer les contrôles liés au compte

```bash
prowler aws \
  --profile "$PROFIL_AWS" \
  --services account \
  --output-directory rapports/account \
  --output-formats json csv html
```

### 6.2. Ouvrir le rapport HTML

```bash
# macOS
open "$(ls rapports/account/*.html | head -1)"
# Linux
xdg-open "$(ls rapports/account/*.html | head -1)"
```

### 6.3. Extraire les constats en échec

```bash
grep -i "FAIL" rapports/account/*.csv > rapports/account/account-constats-echec.csv
head -n 20 rapports/account/account-constats-echec.csv
```

### 6.4. Analyse attendue Account

| Famille de constats | Risque associé | Exemple de remédiation |
|---|---|---|
| Informations de contact absentes | Gestion d'incident difficile | Renseigner les contacts de sécurité |
| Contacts alternatifs non configurés | Alertes mal routées | Configurer contacts sécurité, facturation et opérations |
| Paramètres de compte non maîtrisés | Gouvernance insuffisante | Formaliser la gestion du compte |

---

## Étape 7 : Analyse par sévérité

> **Note** : la concaténation de plusieurs CSV peut produire des lignes d'en-tête intercalées. Les `grep` suivants fonctionnent quand même — la ligne d'en-tête ne contient pas `critical`, `high`, `medium` ou `low` comme valeur de sévérité.

### 7.1. Regrouper les CSV IAM et Account

```bash
cat rapports/iam/*.csv rapports/account/*.csv > rapports/severite/resultats-iam-account.csv
```

### 7.2. Compter par sévérité

```bash
grep -ic "critical" rapports/severite/resultats-iam-account.csv
grep -ic "high"     rapports/severite/resultats-iam-account.csv
grep -ic "medium"   rapports/severite/resultats-iam-account.csv
grep -ic "low"      rapports/severite/resultats-iam-account.csv
```

### 7.3. Extraire les constats critiques et élevés

```bash
grep -i "critical" rapports/severite/resultats-iam-account.csv \
  > rapports/severite/constats-critiques.csv
head -n 10 rapports/severite/constats-critiques.csv

grep -i "high" rapports/severite/resultats-iam-account.csv \
  > rapports/severite/constats-eleves.csv
head -n 10 rapports/severite/constats-eleves.csv
```

### 7.4. Extraire les constats moyens et faibles

```bash
grep -i "medium" rapports/severite/resultats-iam-account.csv \
  > rapports/severite/constats-moyens.csv

grep -i "low" rapports/severite/resultats-iam-account.csv \
  > rapports/severite/constats-faibles.csv
```

### 7.5. Interprétation attendue

Les constats critiques et élevés sont à regarder en premier. Un constat en échec doit être interprété dans son contexte. La priorité dépend de la sévérité, de l'exposition, du type d'identité concerné et de la facilité de correction.

---

## Étape 8 : Analyse ciblée avec des contrôles Prowler

### 8.1. Lister les contrôles disponibles

```bash
prowler aws --list-checks | head -n 50
prowler aws --list-checks | grep "^iam_"     | head -n 50
prowler aws --list-checks | grep "^account_" | head -n 50
```

### 8.2. Exécuter un contrôle IAM précis

> **Prérequis** : vérifier que le contrôle existe dans la version installée avant de l'exécuter :
>
> ```bash
> prowler aws --list-checks | grep "mfa"
> ```

Exemple avec un contrôle MFA (adapter le nom si nécessaire) :

```bash
prowler aws \
  --profile "$PROFIL_AWS" \
  --checks iam_user_mfa_enabled_console_access \
  --output-directory rapports/iam \
  --output-formats json csv html
```

### 8.3. Exécuter plusieurs contrôles ciblés

```bash
prowler aws \
  --profile "$PROFIL_AWS" \
  --checks iam_user_mfa_enabled_console_access iam_root_mfa_enabled iam_password_policy_minimum_length_14 \
  --output-directory rapports/iam \
  --output-formats json csv html
```

L'exécution ciblée réduit le périmètre d'analyse et est utile pour travailler sur une famille de risques précise. Les noms de contrôles peuvent évoluer selon la version de Prowler.

---

## Étape 9 : Remédiation simple sur IAM

### 9.1. Vérifier la politique de mot de passe actuelle

```bash
aws iam get-account-password-policy \
  --profile "$PROFIL_AWS"
```

> **Note** : si aucune politique n'existe, cette commande retourne une erreur `NoSuchEntity`. La commande suivante crée ou remplace la politique.

### 9.2. Définir une politique de mot de passe renforcée

```bash
aws iam update-account-password-policy \
  --minimum-password-length 14 \
  --require-symbols \
  --require-numbers \
  --require-uppercase-characters \
  --require-lowercase-characters \
  --allow-users-to-change-password \
  --max-password-age 90 \
  --password-reuse-prevention 5 \
  --profile "$PROFIL_AWS"
```

### 9.3. Vérifier la politique appliquée

```bash
aws iam get-account-password-policy \
  --profile "$PROFIL_AWS"
```

---

## Étape 10 : Inspection des utilisateurs et clés d'accès

### 10.1. Lister les utilisateurs IAM

```bash
aws iam list-users \
  --profile "$PROFIL_AWS"

UTILISATEUR_IAM=$(aws iam list-users \
  --profile "$PROFIL_AWS" \
  --query 'Users[0].UserName' \
  --output text)

echo "$UTILISATEUR_IAM"
```

Remplacer `$UTILISATEUR_IAM` par tout autre nom d'utilisateur du compte si besoin.

### 10.2. Lister les clés d'accès de cet utilisateur

```bash
aws iam list-access-keys \
  --user-name "$UTILISATEUR_IAM" \
  --profile "$PROFIL_AWS"
```

### 10.3. Consulter les politiques attachées et inline

```bash
aws iam list-attached-user-policies \
  --user-name "$UTILISATEUR_IAM" \
  --profile "$PROFIL_AWS"

aws iam list-user-policies \
  --user-name "$UTILISATEUR_IAM" \
  --profile "$PROFIL_AWS"
```

Les clés d'accès permanentes doivent être limitées aux cas réellement nécessaires. Les groupes IAM ou rôles IAM sont généralement préférables aux politiques directement attachées à des utilisateurs.

---

## Étape 11 : Nouvelle analyse après correction

### 11.1. Relancer l'analyse IAM

```bash
prowler aws \
  --profile "$PROFIL_AWS" \
  --services iam \
  --output-directory rapports/apres-correction/iam \
  --output-formats json csv html
```

### 11.2. Comparer le nombre de constats en échec

```bash
FICHIER_IAM_AVANT=$(ls rapports/iam/*.csv | head -1)
FICHIER_IAM_APRES=$(ls rapports/apres-correction/iam/*.csv | head -1)

echo "Avant correction :"
grep -i "FAIL" "$FICHIER_IAM_AVANT" | wc -l

echo "Après correction :"
grep -i "FAIL" "$FICHIER_IAM_APRES" | wc -l
```

### 11.3. Ouvrir le rapport HTML après correction

```bash
# macOS
open "$(ls rapports/apres-correction/iam/*.html | head -1)"
# Linux
xdg-open "$(ls rapports/apres-correction/iam/*.html | head -1)"
```

Certains constats peuvent disparaître après correction. D'autres restent présents car ils dépendent d'éléments non modifiés pendant le TP. L'objectif est de comprendre le lien entre une remédiation et le résultat Prowler correspondant.

---

## Étape 12 : Construction d'une synthèse locale

```bash
cat > notes/synthese-prowler.md <<'EOF'
# Synthèse Prowler

## Compte analysé

Le compte AWS a été analysé avec Prowler à partir du profil AWS CLI configuré localement.

## Périmètre analysé

Les contrôles réalisés portent principalement sur IAM et Account.

## Constats prioritaires

- identités sans MFA
- clés d'accès anciennes ou inutilisées
- politiques IAM trop larges
- utilisateur racine
- politique de mot de passe
- contacts ou paramètres de compte incomplets

## Axes de remédiation

1. renforcer la politique de mot de passe
2. activer MFA pour les identités humaines
3. supprimer les clés d'accès inutiles
4. réduire les politiques IAM trop permissives
5. éviter les permissions directement attachées aux utilisateurs lorsque ce n'est pas nécessaire
6. compléter les informations de sécurité du compte
7. relancer Prowler après correction

## Limites de l'analyse

Prowler fournit un inventaire technique. Chaque constat doit être interprété selon le contexte réel du compte, l'usage des identités, les contraintes opérationnelles et la gouvernance en place.
EOF

cat notes/synthese-prowler.md
```

---

## Nettoyage

```bash
rm -rf rapports notes
deactivate
rm -rf .venv
cd ..
rm -rf tp-inventaire-securite-prowler
```

---

## Points clés

1. Prowler analyse statiquement un compte AWS sans modifier aucune ressource
2. Le profil AWS doit disposer de `SecurityAudit` ou `ReadOnlyAccess` — sans cela, les analyses sont silencieusement incomplètes
3. Un constat en échec n'est pas toujours une vulnérabilité exploitable immédiatement
4. Un constat en réussite ne garantit pas que le compte est entièrement sécurisé
5. Prioriser par sévérité, puis par exposition réelle et facilité de correction
6. L'analyse ciblée (`--services iam`) est plus rapide qu'une analyse globale
7. Comparer deux analyses (avant/après correction) mesure l'efficacité d'une remédiation

---

## Repères formateur

### Résultat attendu

L'analyse Prowler produit plusieurs rapports sur IAM et le compte AWS. Les résultats dépendent de l'état initial du compte — un compte récent produit moins de constats qu'un compte utilisé depuis longtemps.

### Constats fréquents

```text
absence de MFA sur certaines identités
clés d'accès anciennes
politique de mot de passe absente ou insuffisante
utilisateur racine non protégé par MFA
politiques IAM trop larges
permissions attachées directement à des utilisateurs
contacts de compte incomplets
```

### Analyse attendue

Les constats doivent être priorisés selon la sévérité, l'exposition réelle, le type d'identité concerné, la criticité des permissions, la facilité de correction et l'impact opérationnel.

### Points de vigilance

Si le profil `default` ne dispose pas des droits `SecurityAudit` ou `ReadOnlyAccess`, les analyses peuvent échouer silencieusement ou être incomplètes.

### Synthèse attendue

```text
lancer une analyse ciblée IAM et Account
générer des rapports HTML, CSV et JSON
repérer les constats en échec
filtrer par sévérité
identifier les risques prioritaires
appliquer une remédiation simple (politique de mot de passe)
comparer les résultats avant et après correction
```
