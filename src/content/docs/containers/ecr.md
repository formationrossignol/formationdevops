---
title: "TP : Registry Docker privé avec ECR"
date: 2026-05-28
description: Créer un registry Docker privé avec Amazon ECR, builder une image Docker, s'authentifier et pousser l'image vers le registry.
---

## Objectif

Créer un registry Docker privé avec Amazon ECR (Elastic Container Registry), builder une image Docker localement, l'authentifier avec ECR et pousser l'image vers le registry.

## Compétences travaillées

- Création et gestion de repositories ECR
- Build d'images Docker
- Authentification Docker avec AWS
- Push et pull d'images vers ECR
- Gestion des tags d'images
- AWS CLI
- Bonnes pratiques Docker et registries

## Architecture cible

```
Machine locale
    |
    | Docker build
    v
Image Docker locale
    |
    | docker login (authentification ECR)
    | docker push
    v
Amazon ECR Repository
    |
    +-- image:latest
    +-- image:v1.0.0
    +-- image:prod
```

## Prérequis

- Compte AWS actif
- Docker installé
- AWS CLI installé et configuré

## Durée estimée

45 minutes

## Coût

100% Free Tier compatible (12 premiers mois)

- ECR : 500 MB de stockage/mois
- Transfert sortant : 1 GB/mois vers Internet

---

## Étape 1 : Vérifier les prérequis

```bash
docker --version
# Docker version 24.0.x ou supérieur

aws --version
# aws-cli/2.x.x

aws sts get-caller-identity
# Retourne votre Account ID
```

---

## Étape 2 : Créer un repository ECR

### Via AWS CLI

```bash
aws ecr create-repository \
    --repository-name tp-demo-app \
    --region eu-west-3
```

Résultat :

```json
{
    "repository": {
        "repositoryUri": "123456789012.dkr.ecr.eu-west-3.amazonaws.com/tp-demo-app"
    }
}
```

> Notez le `repositoryUri` — vous en aurez besoin pour taguer et pousser les images.

### Via AWS Console

1. Elastic Container Registry → **Create repository**

| Paramètre | Valeur |
|-----------|--------|
| Visibility | Private |
| Repository name | tp-demo-app |
| Tag immutability | Disabled |
| Scan on push | Disabled |
| Encryption | AES-256 |

---

## Étape 3 : Créer une application Docker

Créez un dossier `tp-ecr-demo/` avec ces fichiers :

### app.js

```javascript
const express = require('express');
const os = require('os');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.json({
        message: 'Application déployée depuis Amazon ECR',
        hostname: os.hostname(),
        platform: os.platform(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### package.json

```json
{
  "name": "tp-ecr-demo",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": { "start": "node app.js" },
  "dependencies": { "express": "^4.18.2" }
}
```

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

### .dockerignore

```
node_modules
npm-debug.log
.git
.env
.DS_Store
```

---

## Étape 4 : Builder et tester localement

```bash
# Builder
docker build -t tp-demo-app:latest .

# Vérifier
docker images tp-demo-app

# Tester
docker run -d -p 3000:3000 --name test-app tp-demo-app:latest
curl http://localhost:3000

# Nettoyer
docker stop test-app && docker rm test-app
```

---

## Étape 5 : S'authentifier auprès d'ECR

```bash
aws ecr get-login-password --region eu-west-3 | \
    docker login --username AWS --password-stdin \
    123456789012.dkr.ecr.eu-west-3.amazonaws.com
```

> Remplacez `123456789012` par votre Account ID (`aws sts get-caller-identity --query Account --output text`).

Résultat attendu : `Login Succeeded`

Le token est valide 12 heures.

---

## Étape 6 : Tagger et pousser l'image

### Récupérer l'URI du repository

```bash
aws ecr describe-repositories \
    --repository-names tp-demo-app \
    --region eu-west-3 \
    --query 'repositories[0].repositoryUri' \
    --output text
```

### Tagger l'image

```bash
docker tag tp-demo-app:latest \
    123456789012.dkr.ecr.eu-west-3.amazonaws.com/tp-demo-app:latest

docker tag tp-demo-app:latest \
    123456789012.dkr.ecr.eu-west-3.amazonaws.com/tp-demo-app:v1.0.0

docker tag tp-demo-app:latest \
    123456789012.dkr.ecr.eu-west-3.amazonaws.com/tp-demo-app:prod
```

### Pousser les images

```bash
docker push 123456789012.dkr.ecr.eu-west-3.amazonaws.com/tp-demo-app:latest
docker push 123456789012.dkr.ecr.eu-west-3.amazonaws.com/tp-demo-app:v1.0.0
docker push 123456789012.dkr.ecr.eu-west-3.amazonaws.com/tp-demo-app:prod
```

### Vérifier dans ECR

```bash
aws ecr list-images --repository-name tp-demo-app --region eu-west-3
```

---

## Étape 7 : Tester le pull depuis ECR

```bash
# Supprimer les images locales
docker rmi tp-demo-app:latest
docker rmi 123456789012.dkr.ecr.eu-west-3.amazonaws.com/tp-demo-app:latest

# Puller depuis ECR
docker pull 123456789012.dkr.ecr.eu-west-3.amazonaws.com/tp-demo-app:latest

# Tester
docker run -d -p 3000:3000 \
    123456789012.dkr.ecr.eu-west-3.amazonaws.com/tp-demo-app:latest
curl http://localhost:3000
```

---

## Étape 8 : Lifecycle policy

Les lifecycle policies nettoient automatiquement les anciennes images.

Créez `lifecycle-policy.json` :

```json
{
    "rules": [
        {
            "rulePriority": 1,
            "description": "Garder seulement les 3 dernières images",
            "selection": {
                "tagStatus": "any",
                "countType": "imageCountMoreThan",
                "countNumber": 3
            },
            "action": {
                "type": "expire"
            }
        }
    ]
}
```

```bash
aws ecr put-lifecycle-policy \
    --repository-name tp-demo-app \
    --lifecycle-policy-text file://lifecycle-policy.json \
    --region eu-west-3
```

---

## BONUS : Multi-stage build pour optimiser la taille

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### CI/CD avec GitHub Actions

```yaml
name: Build and Push to ECR

on:
  push:
    branches: [main]

env:
  AWS_REGION: eu-west-3
  ECR_REPOSITORY: tp-demo-app

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build, tag, and push image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
```

---

## Nettoyage

```bash
# Supprimer toutes les images du repository
aws ecr batch-delete-image \
    --repository-name tp-demo-app \
    --image-ids "$(aws ecr list-images --repository-name tp-demo-app --region eu-west-3 --query 'imageIds[*]' --output json)" \
    --region eu-west-3

# Supprimer le repository
aws ecr delete-repository \
    --repository-name tp-demo-app \
    --force \
    --region eu-west-3

# Supprimer les images locales
docker image prune -a
```

---

## Comparaison : ECR vs Docker Hub

| Critère | ECR | Docker Hub |
|---------|-----|-----------|
| Coût Free Tier | 500 MB (12 mois) | Gratuit illimité public |
| Repositories privés | Illimités | 1 gratuit |
| Intégration AWS | Native | Via credentials |
| Scan vulnérabilités | Oui (payant) | Oui (payant) |
| Réplication géographique | Oui | Non |

---

## Points clés

1. ECR est un registry Docker privé managé par AWS
2. Authentification via AWS IAM et token temporaire (12h)
3. Format des tags : `ACCOUNT.dkr.ecr.REGION.amazonaws.com/REPO:TAG`
4. Free Tier : 500 MB pendant 12 mois
5. Lifecycle policies automatisent le nettoyage des anciennes images
6. Intégration native avec ECS, EKS, Lambda
7. Transfert entrant gratuit, sortant limité à 1 GB/mois en Free Tier
