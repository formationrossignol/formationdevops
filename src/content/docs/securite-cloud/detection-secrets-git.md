---
title: "TP : Détection de secrets dans un dépôt Git"
date: 2026-05-28
description: Identifier des secrets exposés dans un dépôt Git avec Gitleaks et TruffleHog, corriger les fichiers, nettoyer l'historique et mettre en place un contrôle avant commit.
---

## Outils

Gitleaks, TruffleHog, Git, AWS CLI

## Objectif

Identifier des secrets présents dans un dépôt Git avant qu'ils ne soient poussés vers un dépôt distant ou utilisés dans une chaîne de déploiement.

1. Créer un dépôt Git local
2. Ajouter volontairement des fichiers contenant de faux secrets
3. Détecter les secrets avec Gitleaks
4. Détecter les secrets avec TruffleHog
5. Comparer les résultats des deux outils
6. Corriger les fichiers
7. Nettoyer l'historique Git
8. Mettre en place un contrôle local avant commit

## Compétences travaillées

| Compétence |
|---|
| Comprendre le risque des secrets dans le code |
| Identifier des secrets dans un dépôt Git |
| Utiliser Gitleaks |
| Utiliser TruffleHog |
| Différencier fichier courant et historique Git |
| Nettoyer un secret d'un dépôt local |
| Mettre en place un contrôle avant commit |

## Durée estimée

3 heures

| Séquence | Durée |
|---|---:|
| Préparation locale | 15 min |
| Création du dépôt vulnérable | 20 min |
| Analyse avec Gitleaks | 30 min |
| Analyse avec TruffleHog | 30 min |
| Correction des secrets | 30 min |
| Nettoyage de l'historique Git | 35 min |
| Mise en place d'un contrôle avant commit | 20 min |
| Nettoyage | 10 min |

## Coût

100% gratuit  tous les outils sont open source.

## Scénario

Une équipe prépare le déploiement d'une petite application interne. Le dépôt contient par erreur plusieurs secrets : clé d'accès AWS fictive, jeton d'API, mot de passe de base de données, fichier `.env`. L'objectif est de détecter ces secrets avant commit ou avant déploiement, puis de corriger le dépôt.

> **Note sur les secrets fictifs** : les valeurs `AKIAIOSFODNN7EXAMPLE` et `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` sont les exemples officiels de la documentation AWS. Certains outils les ont mis en liste blanche. Si un outil ne les détecte pas, c'est un comportement attendu.

---

## Étape 1 : Préparation de l'environnement

### 1.1 Créer le répertoire de travail

```bash
mkdir -p tp-detection-secrets
cd tp-detection-secrets
mkdir -p rapports application scripts
```

### 1.2 Vérifier Git

```bash
git --version
```

### 1.3 Vérifier et installer `jq`

`jq` sert à afficher les rapports JSON de façon lisible.

```bash
jq --version

# macOS
brew install jq
# Ubuntu/Debian
sudo apt install jq -y
# Windows
winget install jqlang.jq
```

Fallback si `jq` non disponible :

```bash
python -m json.tool fichier.json
```

### 1.4 Installer Gitleaks

> Gitleaks v8 minimum requis pour `gitleaks protect --staged`.

```bash
# macOS
brew install gitleaks

# Linux (binaire)
GITLEAKS_VERSION=$(curl -s https://api.github.com/repos/gitleaks/gitleaks/releases/latest \
  | grep tag_name | cut -d '"' -f4 | sed 's/v//')
curl -sSL "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" \
  | tar -xz -C /usr/local/bin gitleaks

# Via Go
go install github.com/gitleaks/gitleaks/v8@latest
```

```bash
gitleaks version
```

### 1.5 Installer TruffleHog

```bash
# macOS
brew install trufflehog

# Linux (script officiel)
curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh \
  | sh -s -- -b /usr/local/bin

# Linux (binaire)
TRUFFLEHOG_VERSION=$(curl -s https://api.github.com/repos/trufflesecurity/trufflehog/releases/latest \
  | grep tag_name | cut -d '"' -f4 | sed 's/v//')
curl -sSL "https://github.com/trufflesecurity/trufflehog/releases/download/v${TRUFFLEHOG_VERSION}/trufflehog_${TRUFFLEHOG_VERSION}_linux_amd64.tar.gz" \
  | tar -xz -C /usr/local/bin trufflehog
```

```bash
trufflehog --version
```

---

## Étape 2 : Création du dépôt Git vulnérable

### 2.1 Initialiser le dépôt

```bash
git init
git config user.name "Apprenant Sécurité"
git config user.email "apprenant@example.com"
```

### 2.2 Créer une application minimale

```bash
cat > application/app.py <<'EOF'
import os

def main():
    environment = os.getenv("APP_ENV", "development")
    print(f"Application lancée en mode {environment}")

if __name__ == "__main__":
    main()
EOF
```

```bash
cat > README.md <<'EOF'
# Application de démonstration

Ce dépôt sert à tester la détection de secrets avant commit et avant déploiement.
EOF
```

```bash
cat > .gitignore <<'EOF'
.env
*.local
rapports/
EOF
```

> `.gitignore` n'est pas un mécanisme de sécurité. Le fichier `.env` reste présent localement et peut être détecté par un scan du système de fichiers ou inclus dans une archive.

### 2.3 Premier commit propre

```bash
git add README.md application/app.py .gitignore
git commit -m "Initialisation du projet"
git log --oneline
```

---

## Étape 3 : Ajout de faux secrets

### 3.1 Fichier de configuration avec secrets

```bash
cat > application/config.py <<'EOF'
AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

DATABASE_URL = "postgresql://admin:SuperPassword123@db.internal.local:5432/app"
API_TOKEN = "ghp_0123456789abcdefghijklmnopqrstuvwx"
EOF
```

### 3.2 Fichier `.env` (ignoré par Git)

```bash
cat > .env <<'EOF'
APP_ENV=development
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
DATABASE_PASSWORD=SuperPassword123
STRIPE_SECRET_KEY=sk_test_51N000000000000000000000000
EOF
```

Ce fichier est ignoré par Git  détectable uniquement par scan du système de fichiers.

### 3.3 Script de déploiement avec secrets

```bash
cat > application/deploy.sh <<'EOF'
#!/usr/bin/env bash

export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

echo "Déploiement de démonstration"
EOF
chmod +x application/deploy.sh
```

### 3.4 Commiter les fichiers suivis

```bash
git add application/config.py application/deploy.sh
git commit -m "Ajout de la configuration applicative"
git log --oneline
```

Vérifier que `.env` n'est pas suivi :

```bash
git ls-files   # .env ne doit pas apparaître
```

---

## Étape 4 : Analyse avec Gitleaks

### 4.1 Scanner le dépôt Git

```bash
gitleaks git . \
  --report-format json \
  --report-path rapports/gitleaks-git.json

jq . rapports/gitleaks-git.json
```

| Fichier | Résultat attendu |
|---|---|
| `application/config.py` | Secrets détectés |
| `application/deploy.sh` | Secrets détectés |
| `.env` | Non analysé (non suivi par Git) |

### 4.2 Scanner le système de fichiers

```bash
gitleaks dir . \
  --report-format json \
  --report-path rapports/gitleaks-dir.json

jq . rapports/gitleaks-dir.json
```

| Élément | Scan Git | Scan répertoire |
|---|---|---|
| `application/config.py` | Détecté | Détecté |
| `application/deploy.sh` | Détecté | Détecté |
| `.env` | Non détecté | Détecté |

### 4.3 Mode verbeux

```bash
gitleaks git . --verbose
```

---

## Étape 5 : Analyse avec TruffleHog

> **Note Windows** : remplacer `file://$(pwd)` par le chemin absolu Windows, ou exécuter depuis WSL.

### 5.1 Scanner le dépôt Git

```bash
# Linux/macOS
trufflehog git file://$(pwd) \
  --json \
  > rapports/trufflehog-git.json

jq . rapports/trufflehog-git.json
```

### 5.2 Scanner le système de fichiers

```bash
trufflehog filesystem . \
  --json \
  > rapports/trufflehog-filesystem.json

jq . rapports/trufflehog-filesystem.json
```

### 5.3 Comparaison des deux outils

| Critère | Gitleaks | TruffleHog |
|---|---|---|
| Détection dans Git | Oui | Oui |
| Détection dans le système de fichiers | Oui | Oui |
| Vérification des secrets | Limitée | Forte orientation vérification |
| Usage recommandé | Prévention rapide avant commit | Recherche approfondie |

```bash
ls -lh rapports
wc -l rapports/*.json
```

---

## Étape 6 : Correction des secrets

### 6.1 Remplacer les secrets par des variables d'environnement

```bash
cat > application/config.py <<'EOF'
import os

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

DATABASE_URL = os.getenv("DATABASE_URL")
API_TOKEN = os.getenv("API_TOKEN")
EOF
```

```bash
cat > application/deploy.sh <<'EOF'
#!/usr/bin/env bash

echo "Déploiement de démonstration"

if [ -z "$AWS_PROFILE" ]; then
  echo "La variable AWS_PROFILE doit être définie."
  exit 1
fi

aws sts get-caller-identity --profile "$AWS_PROFILE"
EOF
```

### 6.2 Créer un fichier d'exemple sans secret

```bash
cat > .env.example <<'EOF'
APP_ENV=development
AWS_PROFILE=nom-du-profil
DATABASE_URL=postgresql://user:password@host:5432/database
API_TOKEN=replace-me
EOF
```

### 6.3 Commit de correction

```bash
git add application/config.py application/deploy.sh .env.example
git commit -m "Suppression des secrets du code applicatif"
```

---

## Étape 7 : Vérification après correction

### 7.1 Scan du répertoire

```bash
gitleaks dir . \
  --report-format json \
  --report-path rapports/gitleaks-dir-after-fix.json

jq . rapports/gitleaks-dir-after-fix.json
```

### 7.2 Scan Git (historique)

```bash
gitleaks git . \
  --report-format json \
  --report-path rapports/gitleaks-git-after-fix.json

jq . rapports/gitleaks-git-after-fix.json
```

| Analyse | Résultat attendu |
|---|---|
| Scan du répertoire | Les secrets corrigés ne doivent plus apparaître |
| Scan Git | Les secrets peuvent encore apparaître dans l'historique |
| Cause | Git conserve les anciens commits |
| Conclusion | Corriger les fichiers ne suffit pas si le secret a été commité |

---

## Étape 8 : Nettoyage de l'historique Git

### 8.1 Visualiser les commits

```bash
git log --oneline
```

Le commit `Ajout de la configuration applicative` contient les secrets.

### 8.2 Reconstruire un dépôt propre

Sauvegarder l'état corrigé :

```bash
# Linux/macOS
rsync -av --exclude=".git" --exclude="rapports" ./ ../sauvegarde-tp-secrets/
```

Supprimer et réinitialiser le dépôt :

```bash
rm -rf .git
git init
git config user.name "Apprenant Sécurité"
git config user.email "apprenant@example.com"
```

Commiter uniquement les fichiers corrigés :

```bash
git add README.md application/app.py application/config.py application/deploy.sh .gitignore .env.example
git commit -m "Version corrigée sans secret"
git log --oneline
```

### 8.3 Vérifier l'historique reconstruit

```bash
gitleaks git . \
  --report-format json \
  --report-path rapports/gitleaks-git-after-history-cleanup.json

jq . rapports/gitleaks-git-after-history-cleanup.json

trufflehog git file://$(pwd) \
  --json \
  > rapports/trufflehog-git-after-history-cleanup.json
```

---

## Étape 9 : Contrôle avant commit (pre-commit hook)

> Requiert Gitleaks v8 minimum.

### 9.1 Créer le hook

```bash
cat > .git/hooks/pre-commit <<'EOF'
#!/usr/bin/env bash

echo "Analyse des secrets avec Gitleaks avant commit"

gitleaks protect --staged --verbose

RESULT=$?

if [ $RESULT -ne 0 ]; then
  echo "Commit bloqué : un secret potentiel a été détecté."
  exit 1
fi

echo "Aucun secret détecté dans les fichiers préparés pour le commit."
exit 0
EOF

chmod +x .git/hooks/pre-commit
```

### 9.2 Tester le blocage

```bash
cat > application/test-secret.txt <<'EOF'
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
EOF

git add application/test-secret.txt
git commit -m "Test de détection de secret"
```

Résultat attendu : commit bloqué.

### 9.3 Supprimer le fichier de test

```bash
git reset application/test-secret.txt
rm application/test-secret.txt
```

---

## Étape 10 : Variante  scan d'un fichier de credentials AWS

### 10.1 Créer un profil factice

```bash
mkdir -p aws-factice

cat > aws-factice/credentials <<'EOF'
[demo]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
EOF
```

### 10.2 Scanner

```bash
gitleaks dir aws-factice \
  --report-format json \
  --report-path rapports/gitleaks-aws-factice.json

trufflehog filesystem aws-factice \
  --json \
  > rapports/trufflehog-aws-factice.json
```

### 10.3 Supprimer

```bash
rm -rf aws-factice
```

---

## Analyse finale du risque

| Point observé | Enseignement |
|---|---|
| Secret dans un fichier courant | Le scan du système de fichiers est utile |
| Secret dans l'historique Git | Le scan Git est indispensable |
| Fichier ignoré par Git avec secret | `.gitignore` ne protège pas contre les fuites locales |
| Résultats différents selon les outils | Les outils sont complémentaires |
| Suppression du fichier insuffisante | Il faut traiter l'historique et remplacer le secret exposé |
| Hook pre-commit | Bloque la fuite avant qu'elle n'arrive |

| Situation | Réaction attendue |
|---|---|
| Secret détecté avant commit | Supprimer, utiliser une variable d'environnement |
| Secret dans l'historique local | Nettoyer l'historique |
| Secret poussé sur un dépôt distant | Remplacer immédiatement le secret |
| Clé AWS exposée | Désactiver puis supprimer la clé dans IAM |
| Faux positif | Documenter l'exception ou ajuster la configuration |

---

## Nettoyage

```bash
rm -f .env
rm -rf aws-factice rapports
git status
gitleaks git .
trufflehog git file://$(pwd)
```

---

## Points clés

1. Un secret commité reste dans l'historique Git même après suppression du fichier
2. `.gitignore` empêche le suivi mais pas la détection locale
3. Gitleaks et TruffleHog sont complémentaires : les utiliser ensemble
4. Le hook `pre-commit` est la première ligne de défense
5. Tout secret réellement exposé doit être révoqué, pas seulement supprimé du code
6. Utiliser des variables d'environnement et un fichier `.env.example` sans valeurs sensibles

## Sources

| Sujet | Source |
|---|---|
| Gitleaks | https://github.com/gitleaks/gitleaks |
| TruffleHog | https://github.com/trufflesecurity/trufflehog |
| AWS IAM, clés d'accès | https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html |
