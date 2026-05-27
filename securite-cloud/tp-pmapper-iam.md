---
title: "TP : Analyser les chemins d'escalade IAM avec PMapper"
description: Utiliser PMapper pour analyser les permissions IAM et détecter un chemin d'escalade de privilèges via sts:AssumeRole.
---

# TP : Analyser les chemins d'escalade IAM avec PMapper

## Objectif

Utiliser **PMapper** pour analyser les permissions IAM d'un compte AWS de test et détecter un chemin d'escalade de privilèges basé sur `sts:AssumeRole`.

PMapper, ou **Principal Mapper**, est un outil open source de NCC Group qui modélise les utilisateurs et rôles IAM sous forme de graphe. Il permet d'identifier des chemins d'accès indirects, notamment via des relations d'assumption de rôle.

Sources :
- https://github.com/nccgroup/PMapper
- https://github.com/nccgroup/PMapper/wiki/Getting-Started
- https://github.com/nccgroup/PMapper/wiki/Query-Reference

---

## Compatibilité Free Tier

Ce TP est compatible Free Tier si vous restez sur :

```text
IAM
STS
AWS CLI
PMapper en local
CloudTrail Event History
```

Ne crée pas de ressources comme :

```text
EC2
RDS
EKS
NAT Gateway
Load Balancer
Lambda
S3 avec gros volume
```

IAM et STS ne génèrent pas de coût direct dans ce TP. Le risque de coût vient surtout d'un rôle trop permissif qui pourrait créer des ressources payantes.

---

## Scénario du TP

On va créer volontairement une mauvaise configuration IAM :

```text
lab-dev-user
      │
      │ sts:AssumeRole
      ▼
lab-admin-role
      │
      │ AdministratorAccess
      ▼
Accès administrateur
```

PMapper devra détecter que `lab-dev-user` peut obtenir des privilèges élevés via `lab-admin-role`.

---

## Prérequis

Sur votre poste :

```text
Windows, Linux ou macOS
Python 3.9 recommandé (voir note ci-dessous)
pip
AWS CLI
Graphviz
Compte AWS sandbox
```

> **Note Python** : PMapper peut avoir des problèmes de compatibilité avec certaines versions récentes de Python. Python 3.9 est recommandé. Pour gérer plusieurs versions Python en parallèle sans affecter ton système, utilise [pyenv](https://github.com/pyenv/pyenv) (Linux/macOS) ou [pyenv-win](https://github.com/pyenv-win/pyenv-win) (Windows). Exemple :
>
> ```bash
> pyenv install 3.9.18
> pyenv local 3.9.18
> python -m venv venv-pmapper
> source venv-pmapper/bin/activate   # Linux/macOS
> # ou
> .\venv-pmapper\Scripts\Activate    # Windows PowerShell
> pip install principalmapper
> ```

---

## Étape 1 : Installer les outils

### Option Windows PowerShell

Installer PMapper :

```powershell
pip install principalmapper
```

Installer AWS CLI :

```text
https://aws.amazon.com/cli/
```

Installer Graphviz :

```text
https://graphviz.org/download/
```

Vérifier les installations :

```powershell
python --version
pip --version
aws --version
pmapper --help
dot -V
```

Si `pmapper` n'est pas reconnu, vérifier que le dossier Python Scripts est dans le `PATH`.

Exemple :

```text
C:\Users\<TON_USER>\AppData\Roaming\Python\Python39\Scripts
```

---

### Option WSL Ubuntu

```bash
sudo apt update
sudo apt install python3 python3-pip awscli graphviz -y
pip3 install principalmapper
```

Vérifier :

```bash
aws --version
pmapper --help
dot -V
```

---

## Étape 2 : Créer un profil AWS CLI

Configurer un profil dédié avec des droits suffisants pour lire IAM (un utilisateur avec `AdministratorAccess` ou au minimum les droits `iam:Get*` et `iam:List*` est requis pour que PMapper puisse construire le graphe) :

```bash
aws configure --profile pmapper-lab
```

Renseigner :

```text
AWS Access Key ID
AWS Secret Access Key
Default region name: eu-west-3
Default output format: json
```

Vérifier l'identité :

```bash
aws sts get-caller-identity --profile pmapper-lab
```

Résultat attendu :

```json
{
  "UserId": "...",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/..."
}
```

---

## Étape 3 : Créer l'utilisateur IAM de lab

Dans AWS Console :

```text
IAM → Users → Create user
```

Nom :

```text
lab-dev-user
```

Créer une access key pour cet utilisateur :

```text
Security credentials → Create access key
```

Utilisation :

```text
Command Line Interface
```

Sauvegarder :

```text
Access Key ID
Secret Access Key
```

---

## Étape 4 : Créer le rôle IAM sensible avec sa trust policy

> **Note** : les étapes de création du rôle et de configuration de la trust policy sont regroupées ici pour éviter une manipulation inutile.

Dans AWS Console :

```text
IAM → Roles → Create role
```

Choisir :

```text
Custom trust policy
```

Récupère d'abord ton Account ID :

```bash
aws sts get-caller-identity --profile pmapper-lab
```

Note la valeur du champ `Account`. Exemple : `123456789012`

Renseigner directement la trust policy finale en remplaçant `<ACCOUNT_ID>` par ta valeur :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<ACCOUNT_ID>:user/lab-dev-user"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Exemple avec un vrai Account ID :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:user/lab-dev-user"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Nom du rôle :

```text
lab-admin-role
```

Attacher la policy AWS managée :

```text
AdministratorAccess
```

> À faire uniquement dans un compte sandbox.

---

## Étape 5 : Donner à lab-dev-user le droit d'assumer le rôle

Dans IAM :

```text
Users → lab-dev-user → Permissions → Add permissions → Create inline policy
```

JSON (remplacer `<ACCOUNT_ID>`) :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAssumeLabAdminRole",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::<ACCOUNT_ID>:role/lab-admin-role"
    }
  ]
}
```

Nom de la policy :

```text
lab-allow-assume-admin-role
```

---

## Étape 6 : Configurer le profil AWS de lab-dev-user

Créer un profil AWS CLI avec les clés de `lab-dev-user` :

```bash
aws configure --profile lab-dev-user
```

Tester :

```bash
aws sts get-caller-identity --profile lab-dev-user
```

Résultat attendu :

```text
arn:aws:iam::<ACCOUNT_ID>:user/lab-dev-user
```

---

## Étape 7 : Tester manuellement l'assumption de rôle

Depuis le terminal :

```bash
aws sts assume-role \
  --profile lab-dev-user \
  --role-arn arn:aws:iam::<ACCOUNT_ID>:role/lab-admin-role \
  --role-session-name test-pmapper-lab
```

Résultat attendu :

```json
{
  "Credentials": {
    "AccessKeyId": "...",
    "SecretAccessKey": "...",
    "SessionToken": "...",
    "Expiration": "..."
  },
  "AssumedRoleUser": {
    "Arn": "arn:aws:sts::<ACCOUNT_ID>:assumed-role/lab-admin-role/test-pmapper-lab"
  }
}
```

Cela confirme que la mauvaise configuration fonctionne.

---

## Étape 8 : Générer le graphe IAM avec PMapper

Utiliser le profil `pmapper-lab` qui dispose des droits de lecture IAM.

```bash
pmapper --profile pmapper-lab graph create
```

PMapper va collecter les utilisateurs, rôles, groupes, policies et relations IAM du compte, puis construire un graphe local.

Résultat attendu en sortie console :

```text
Starting data gathering...
Finished building graph for account XXXXXXXXXXXX
```

---

## Étape 9 : Lancer une analyse globale

```bash
pmapper --profile pmapper-lab analysis
```

Observer les résultats. Recherchez des éléments liés à :

```text
privilege escalation
admin access
role assumption
lab-dev-user
lab-admin-role
```

---

## Étape 10 : Chercher une escalade de privilèges

Tester le preset `privesc` sur `lab-dev-user` :

```bash
pmapper --profile pmapper-lab query "preset privesc user/lab-dev-user"
```

Résultat attendu :

```text
PMapper doit indiquer que lab-dev-user possède un chemin vers des privilèges plus élevés.
```

Pour scanner tous les principals d'un coup :

```bash
pmapper --profile pmapper-lab query "preset privesc *"
```

---

## Étape 11 : Tester une action sensible

Tester si `lab-dev-user` peut indirectement créer un utilisateur IAM :

```bash
pmapper --profile pmapper-lab query "can user/lab-dev-user do iam:CreateUser"
```

Tester qui peut créer un utilisateur IAM :

```bash
pmapper --profile pmapper-lab query "who can do iam:CreateUser"
```

Résultat attendu :

```text
PMapper doit montrer que lab-dev-user peut atteindre cette action via lab-admin-role.
```

---

## Étape 12 : Générer une visualisation du graphe

Créer une image du graphe :

```bash
pmapper --profile pmapper-lab visualize --filetype png
```

Le fichier PNG est généré dans le répertoire local de données PMapper. Son chemin dépend du système :

```text
Linux/macOS : ~/.local/share/principalmapper/<ACCOUNT_ID>/
Windows     : C:\Users\<TON_USER>\AppData\Local\nccgroup\principalmapper\<ACCOUNT_ID>\
```

Ouvrir le fichier généré et chercher :

```text
lab-dev-user
lab-admin-role
```

Le graphe doit montrer une relation d'accès ou de pivot entre l'utilisateur et le rôle.

---

## Étape 13 : Comprendre la faille

La faille vient de la combinaison de deux éléments.

### Côté utilisateur

`lab-dev-user` possède cette permission :

```json
{
  "Effect": "Allow",
  "Action": "sts:AssumeRole",
  "Resource": "arn:aws:iam::<ACCOUNT_ID>:role/lab-admin-role"
}
```

### Côté rôle

`lab-admin-role` fait confiance à `lab-dev-user` :

```json
{
  "Effect": "Allow",
  "Principal": {
    "AWS": "arn:aws:iam::<ACCOUNT_ID>:user/lab-dev-user"
  },
  "Action": "sts:AssumeRole"
}
```

Ces deux conditions sont nécessaires et suffisantes pour que `lab-dev-user` puisse devenir temporairement `lab-admin-role`.

---

## Étape 14 : Corriger la mauvaise configuration

Supprimer la permission `sts:AssumeRole` de `lab-dev-user`.

Dans IAM :

```text
Users → lab-dev-user → Permissions
```

Supprimer la policy inline :

```text
lab-allow-assume-admin-role
```

---

## Étape 15 : Durcir la trust policy du rôle

Modifier la trust policy de `lab-admin-role` pour supprimer toute relation de confiance :

```json
{
  "Version": "2012-10-17",
  "Statement": []
}
```

Alternative plus réaliste en production : autoriser seulement un rôle précis (pas un utilisateur direct) avec une condition sur l'identité de session.

---

## Étape 16 : Régénérer le graphe PMapper

Après correction :

```bash
pmapper --profile pmapper-lab graph create
```

Relancer l'analyse :

```bash
pmapper --profile pmapper-lab analysis
```

Relancer la requête :

```bash
pmapper --profile pmapper-lab query "preset privesc user/lab-dev-user"
```

Résultat attendu :

```text
Le chemin d'escalade ne doit plus apparaître.
```

---

## Étape 17 : Vérifier manuellement que l'escalade ne fonctionne plus

Tester à nouveau :

```bash
aws sts assume-role \
  --profile lab-dev-user \
  --role-arn arn:aws:iam::<ACCOUNT_ID>:role/lab-admin-role \
  --role-session-name test-after-fix
```

Résultat attendu :

```text
An error occurred (AccessDenied) when calling the AssumeRole operation
```

---

## Étape 18 : Observer les traces dans CloudTrail Event History

Dans AWS Console :

```text
CloudTrail → Event history
```

Chercher les événements :

```text
AssumeRole
CreateRole
AttachRolePolicy
PutUserPolicy
UpdateAssumeRolePolicy
DeleteUserPolicy
```

But : comprendre quelles actions IAM apparaissent dans les logs AWS et pouvoir les corréler avec les actions effectuées pendant le TP.

---

## Questions de validation

1. Quel utilisateur IAM avait des permissions faibles au départ ?
2. Quel rôle possédait `AdministratorAccess` ?
3. Quelle permission côté utilisateur permettait d'assumer le rôle ?
4. Pourquoi la trust policy du rôle seule ne suffit-elle pas pour qu'un utilisateur puisse l'assumer ?
5. Pourquoi la permission `sts:AssumeRole` côté utilisateur seule ne suffit-elle pas ?
6. Quelle commande PMapper permet de détecter le chemin d'escalade ?
7. Quelle correction a supprimé le chemin d'escalade ?
8. Quel événement CloudTrail permet de tracer une assumption de rôle ?

---

## Nettoyage

Supprimer toutes les ressources créées :

```text
lab-dev-user
access keys de lab-dev-user
policy inline lab-allow-assume-admin-role
lab-admin-role
fichiers générés par PMapper (~/.local/share/principalmapper/ ou équivalent Windows)
```

Vérifier également :

```text
IAM → Users
IAM → Roles
IAM → Policies
CloudTrail → Event history
Billing
```

---

## Résultat attendu final

À la fin du TP, vous devez savoir :

```text
Installer PMapper
Créer un graphe IAM
Analyser les relations users/roles
Identifier une escalade via sts:AssumeRole
Tester l'escalade avec AWS CLI
Corriger la configuration IAM
Vérifier la correction avec PMapper
Retrouver les événements dans CloudTrail
```

---

## Commandes principales à retenir

```bash
# Vérifier l'identité du profil d'analyse
aws sts get-caller-identity --profile pmapper-lab

# Construire le graphe IAM
pmapper --profile pmapper-lab graph create

# Lancer l'analyse globale
pmapper --profile pmapper-lab analysis

# Détecter une escalade sur un utilisateur précis
pmapper --profile pmapper-lab query "preset privesc user/lab-dev-user"

# Tester une action sensible
pmapper --profile pmapper-lab query "can user/lab-dev-user do iam:CreateUser"

# Générer la visualisation PNG
pmapper --profile pmapper-lab visualize --filetype png
```
