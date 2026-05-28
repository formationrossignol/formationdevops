---
title: "TP : Fonction serverless minimale avec AWS SAM, cfn-lint et Checkov"
description: Déployer une fonction Lambda avec AWS SAM et analyser les permissions IAM avec cfn-lint et Checkov.
---

## Objectif

Déployer une fonction Lambda minimale avec AWS SAM, puis analyser le modèle d'infrastructure et les permissions IAM associées.

1. Créer une application SAM minimale
2. Écrire une fonction Lambda Python
3. Créer un modèle SAM volontairement imparfait
4. Valider le modèle avec SAM CLI
5. Analyser le modèle avec cfn-lint
6. Analyser le modèle avec Checkov
7. Corriger les permissions IAM et la configuration Lambda
8. Déployer la fonction
9. Tester l'invocation
10. Consulter les journaux
11. Supprimer les ressources

## Sources

| Sujet | Source |
|---|---|
| AWS SAM CLI | https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli.html |
| AWS Lambda | https://docs.aws.amazon.com/lambda/latest/dg/welcome.html |
| Modèle SAM | https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification.html |
| cfn-lint | https://github.com/aws-cloudformation/cfn-lint |
| Checkov | https://www.checkov.io |
| Bonnes pratiques Lambda | https://docs.aws.amazon.com/lambda/latest/operatorguide/best-practices.html |

## Durée estimée

| Séquence | Durée |
|---|---:|
| Préparation locale | 20 min |
| Création du projet SAM | 25 min |
| Validation SAM | 20 min |
| Analyse avec cfn-lint | 20 min |
| Analyse avec Checkov | 30 min |
| Correction du modèle | 35 min |
| Déploiement | 30 min |
| Test et journaux | 20 min |
| Nettoyage | 15 min |
| **Total** | **3 h 15** |

## Compétences travaillées

| Compétence | Niveau attendu |
|---|---|
| Lire un modèle SAM | Débutant à intermédiaire |
| Déployer une fonction Lambda simple | Intermédiaire |
| Comprendre les rôles IAM Lambda | Intermédiaire |
| Analyser un modèle CloudFormation avec cfn-lint | Intermédiaire |
| Analyser un modèle SAM avec Checkov | Intermédiaire |
| Corriger des permissions IAM trop larges | Intermédiaire |
| Lire les journaux CloudWatch Logs d'une Lambda | Intermédiaire |

## Scénario

Une équipe souhaite créer une fonction Lambda minimale pour exposer un traitement simple.

Avant de généraliser ce modèle, l'équipe veut vérifier :

```text
la validité du modèle SAM
la qualité structurelle du modèle CloudFormation
les permissions IAM accordées à la fonction
la configuration des journaux
la capacité à tester et supprimer proprement les ressources
```

Le modèle initial fonctionne, mais il contient volontairement une politique IAM trop large.

---

## Étape 1 : Préparation de l'environnement

### 1.1. Créer le répertoire de travail

```bash
mkdir -p tp-serverless-securise
cd tp-serverless-securise
mkdir -p src events rapports/cfn-lint rapports/checkov
```

### 1.2. Créer un `.gitignore`

```bash
cat > .gitignore <<'EOF'
.venv/
.aws-sam/
response.json
rapports/
__pycache__/
*.pyc
EOF
```

### 1.3. Créer un environnement Python

```bash
python3 -m venv .venv
source .venv/bin/activate       # Linux/macOS
# ou
.\.venv\Scripts\Activate        # Windows PowerShell

python -m pip install --upgrade pip
```

### 1.4. Installer AWS SAM CLI

**macOS :**

```bash
brew install aws-sam-cli
```

**Linux (installeur officiel AWS) :**

```bash
curl -sSL https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip \
  -o aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install
rm -rf aws-sam-cli-linux-x86_64.zip sam-installation
```

Vérifier l'installation :

```bash
sam --version
```

### 1.5. Installer cfn-lint et Checkov

```bash
pip install cfn-lint checkov
cfn-lint --version
checkov --version
```

### 1.6. Vérifier AWS CLI

```bash
aws --version
aws sts get-caller-identity --profile default
```

---

## Étape 2 : Création de la fonction Lambda

### 2.1. Créer le fichier Python

```bash
cat > src/app.py <<'EOF'
import json
import os
from datetime import datetime, timezone

def lambda_handler(event, context):
    app_name = os.getenv("APP_NAME", "serverless-security-lab")

    response = {
        "application": app_name,
        "message": "Fonction Lambda exécutée avec succès",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "input": event
    }

    return {
        "statusCode": 200,
        "body": json.dumps(response)
    }
EOF
```

### 2.2. Créer un événement de test

```bash
cat > events/event.json <<'EOF'
{
  "source": "tp",
  "action": "test-local"
}
EOF
```

---

## Étape 3 : Création d'un modèle SAM volontairement imparfait

```bash
cat > template.yaml <<'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Fonction Lambda minimale pour TP sécurité serverless

Globals:
  Function:
    Runtime: python3.12
    Timeout: 30
    MemorySize: 128

Resources:
  LabFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: serverless-security-lab-function
      CodeUri: src/
      Handler: app.lambda_handler
      Environment:
        Variables:
          APP_NAME: serverless-security-lab
      Policies:
        - Statement:
            - Effect: Allow
              Action:
                - "*"
              Resource: "*"

Outputs:
  LabFunctionName:
    Description: Nom de la fonction Lambda
    Value: !Ref LabFunction

  LabFunctionArn:
    Description: ARN de la fonction Lambda
    Value: !GetAtt LabFunction.Arn
EOF
```

Ce modèle fonctionne, mais il contient une permission IAM trop large :

```text
Action: "*"
Resource: "*"
```

---

## Étape 4 : Validation avec AWS SAM CLI

### 4.1. Valider le modèle SAM

```bash
sam validate
```

### 4.2. Construire l'application

```bash
sam build
```

### 4.3. Tester localement (optionnel — nécessite Docker)

> **Prérequis** : `sam local invoke` requiert que Docker soit installé et en cours d'exécution. Si Docker n'est pas disponible, cette étape peut être ignorée — les analyses statiques des sections suivantes restent pleinement fonctionnelles.

```bash
sam local invoke LabFunction \
  --event events/event.json
```

Un modèle valide pour SAM peut tout de même contenir une politique IAM dangereuse. La validation syntaxique ne remplace pas l'analyse sécurité.

---

## Étape 5 : Analyse avec cfn-lint

### 5.1. Lancer cfn-lint

> **Note** : cfn-lint retourne un code de sortie non nul (2 ou supérieur) lorsqu'il détecte des erreurs ou avertissements. Le `|| true` ci-dessous permet de capturer le rapport dans le fichier même si cfn-lint signale des problèmes, sans interrompre le shell.

```bash
cfn-lint template.yaml \
  > rapports/cfn-lint/cfn-lint-template.txt || true
```

### 5.2. Afficher le rapport

```bash
cat rapports/cfn-lint/cfn-lint-template.txt
```

cfn-lint vérifie la structure et la validité du modèle CloudFormation ou SAM. Il détecte des erreurs de propriétés, de types, de références ou de structure. Il ne remplace pas une analyse sécurité approfondie des permissions IAM — c'est le rôle de Checkov.

---

## Étape 6 : Analyse avec Checkov

> **Note sur `--output-file-path console,...`** : cette syntaxe peut échouer selon la version de Checkov installée. Si la commande combinée ci-dessous échoue, utiliser les deux commandes séparées indiquées en commentaire.

### 6.1. Scanner le modèle SAM

```bash
checkov \
  -f template.yaml \
  --framework cloudformation \
  --output cli \
  --output json \
  --output-file-path console,rapports/checkov/checkov-template.json

# Si la commande ci-dessus échoue, exécuter séparément :
# checkov -f template.yaml --framework cloudformation --output cli
# checkov -f template.yaml --framework cloudformation --output json \
#   --output-file-path rapports/checkov/checkov-template.json
```

### 6.2. Afficher le rapport JSON

```bash
cat rapports/checkov/checkov-template.json
```

Analyse attendue :

| Constat | Ressource | Risque |
|---|---|---|
| Politique IAM trop large | `LabFunction` | Surprivilège |
| Action `*` | Politique IAM | Droits non maîtrisés |
| Ressource `*` | Politique IAM | Périmètre global |
| Rétention des journaux non définie | Fonction Lambda | Conservation non maîtrisée |

Le modèle SAM est valide, mais la politique IAM attachée à la fonction est trop permissive. Le rôle d'exécution Lambda doit respecter le moindre privilège.

---

## Étape 7 : Correction du modèle SAM

```bash
cat > template.yaml <<'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Fonction Lambda minimale pour TP sécurité serverless

Globals:
  Function:
    Runtime: python3.12
    Timeout: 10
    MemorySize: 128
    Tracing: Active
    Environment:
      Variables:
        APP_NAME: serverless-security-lab

Resources:
  LabFunctionLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/lambda/serverless-security-lab-function
      RetentionInDays: 7

  LabFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: serverless-security-lab-function
      CodeUri: src/
      Handler: app.lambda_handler
      Description: Fonction Lambda minimale pour TP sécurité serverless
      Policies:
        - AWSLambdaBasicExecutionRole
      Tags:
        Project: serverless-security-lab
        Environment: lab
    DependsOn:
      - LabFunctionLogGroup

Outputs:
  LabFunctionName:
    Description: Nom de la fonction Lambda
    Value: !Ref LabFunction

  LabFunctionArn:
    Description: ARN de la fonction Lambda
    Value: !GetAtt LabFunction.Arn
EOF
```

Corrections apportées :

| Élément | Avant | Après |
|---|---|---|
| Timeout | 30 secondes | 10 secondes |
| Politique IAM | `Action: "*"` et `Resource: "*"` | `AWSLambdaBasicExecutionRole` |
| Journaux | Créés implicitement | Groupe de journaux explicite |
| Rétention des journaux | Non définie | 7 jours |
| Balises | Absentes | Présentes |
| Traçage | Non configuré | Activé |

---

## Étape 8 : Vérification après correction

### 8.1. Valider le modèle SAM corrigé

```bash
sam validate
sam build
```

### 8.2. Relancer cfn-lint

```bash
cfn-lint template.yaml \
  > rapports/cfn-lint/cfn-lint-template-after-fix.txt || true

cat rapports/cfn-lint/cfn-lint-template-after-fix.txt
```

### 8.3. Relancer Checkov

```bash
checkov \
  -f template.yaml \
  --framework cloudformation \
  --output cli \
  --output json \
  --output-file-path console,rapports/checkov/checkov-template-after-fix.json

cat rapports/checkov/checkov-template-after-fix.json
```

| Élément | Avant correction | Après correction |
|---|---|---|
| Politique IAM | Trop large | Réduite |
| Action `*` | Présente | Supprimée |
| Ressource `*` | Présente dans la politique personnalisée | Supprimée |
| Rétention des journaux | Non définie | Définie |
| Balises | Absentes | Présentes |
| Modèle SAM | Valide | Valide |

---

## Étape 9 : Déploiement de la fonction

> **Note sur le bucket SAM** : `--resolve-s3` crée automatiquement un bucket S3 pour stocker les artefacts de déploiement (code Lambda packagé). Ce bucket **n'est pas supprimé** par `sam delete`. Il devra être supprimé manuellement lors du nettoyage (section 11).

### 9.1. Déployer avec SAM

```bash
sam deploy \
  --stack-name serverless-security-lab \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --region eu-west-1 \
  --profile default
```

### 9.2. Récupérer les sorties de la pile

```bash
aws cloudformation describe-stacks \
  --stack-name serverless-security-lab \
  --region eu-west-1 \
  --profile default \
  --query "Stacks[0].Outputs"
```

### 9.3. Invoquer la fonction

```bash
aws lambda invoke \
  --function-name serverless-security-lab-function \
  --payload file://events/event.json \
  --cli-binary-format raw-in-base64-out \
  --region eu-west-1 \
  --profile default \
  response.json
```

> **Note Windows** : l'option `--payload '{...}'` avec une chaîne JSON inline pose des problèmes d'échappement sur PowerShell. Utiliser `file://events/event.json` comme ci-dessus pour éviter ce problème sur tous les systèmes.

Afficher la réponse :

```bash
cat response.json
```

---

## Étape 10 : Consultation des journaux

### 10.1. Lister les groupes de journaux Lambda

```bash
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/serverless-security-lab-function" \
  --region eu-west-1 \
  --profile default
```

### 10.2. Lister les flux de journaux

```bash
aws logs describe-log-streams \
  --log-group-name "/aws/lambda/serverless-security-lab-function" \
  --order-by LastEventTime \
  --descending \
  --max-items 5 \
  --region eu-west-1 \
  --profile default
```

### 10.3. Lire les événements récents

```bash
aws logs filter-log-events \
  --log-group-name "/aws/lambda/serverless-security-lab-function" \
  --limit 20 \
  --region eu-west-1 \
  --profile default
```

La fonction Lambda écrit des journaux dans CloudWatch Logs. Le rôle d'exécution Lambda dispose uniquement des permissions nécessaires à l'écriture des journaux. La rétention est définie à 7 jours.

---

## Nettoyage

### 11.1. Identifier le bucket SAM créé par `--resolve-s3`

`sam deploy --resolve-s3` crée un bucket S3 nommé automatiquement. L'identifier avant suppression :

```bash
aws s3api list-buckets \
  --profile default \
  --query "Buckets[?starts_with(Name, 'aws-sam-cli-managed')].Name" \
  --output text
```

### 11.2. Supprimer la pile CloudFormation

```bash
sam delete \
  --stack-name serverless-security-lab \
  --region eu-west-1 \
  --profile default
```

### 11.3. Vérifier que la pile est supprimée

```bash
aws cloudformation describe-stacks \
  --stack-name serverless-security-lab \
  --region eu-west-1 \
  --profile default
```

> **Note** : lorsque la pile n'existe plus, cette commande retourne une erreur `ValidationError: Stack with id serverless-security-lab does not exist`. C'est le résultat attendu — cela confirme la suppression.

### 11.4. Supprimer le bucket SAM manuellement

Remplacer `<NOM_BUCKET_SAM>` par la valeur récupérée à l'étape 11.1 :

```bash
# Vider le bucket (requis avant suppression)
aws s3 rm s3://<NOM_BUCKET_SAM> --recursive --profile default

# Supprimer le bucket
aws s3api delete-bucket \
  --bucket <NOM_BUCKET_SAM> \
  --region eu-west-1 \
  --profile default
```

### 11.5. Supprimer les fichiers temporaires locaux

```bash
rm -f response.json
rm -rf .aws-sam
rm -rf rapports
deactivate
rm -rf .venv
```

---

## Points clés

1. `sam validate` vérifie la syntaxe du modèle, pas la sécurité des permissions IAM
2. cfn-lint et Checkov sont complémentaires : cfn-lint valide la structure, Checkov analyse la sécurité
3. Une fonction Lambda doit avoir un rôle IAM minimal — `AWSLambdaBasicExecutionRole` suffit pour les logs
4. La rétention des journaux CloudWatch doit toujours être définie explicitement
5. `sam deploy --resolve-s3` crée un bucket S3 qui ne sera pas supprimé par `sam delete`
6. `sam local invoke` nécessite Docker — les analyses statiques fonctionnent sans
7. Tout déploiement serverless crée aussi des ressources IAM à auditer

---

## Repères formateur

### Résultat attendu avec SAM CLI

`sam validate` doit confirmer que le modèle est valide. Le point important est qu'un modèle valide n'est pas forcément sécurisé.

`sam local invoke` nécessite Docker. Si Docker n'est pas disponible en salle, cette étape est optionnelle — les analyses statiques restent l'objectif principal du TP.

### Résultat attendu avec cfn-lint

cfn-lint doit vérifier la cohérence du modèle CloudFormation ou SAM. Il peut détecter des erreurs de structure, mais ne suffit pas à qualifier les permissions IAM.

Le code de sortie non nul de cfn-lint en présence d'erreurs est attendu et documenté — il ne représente pas un dysfonctionnement de l'outil.

### Résultat attendu avec Checkov

Checkov doit identifier la politique IAM trop large dans le modèle initial :

```text
Action: "*"
Resource: "*"
```

### Remédiation attendue

```text
remplacer la politique IAM générique par AWSLambdaBasicExecutionRole
définir une durée de rétention des journaux
réduire le timeout
ajouter des balises
activer le traçage
```

### Point de vigilance nettoyage

Le bucket S3 créé par `--resolve-s3` n'est pas supprimé par `sam delete`. Si non supprimé, il génère un coût de stockage faible mais continu. Vérifier sa suppression en fin de TP.

### Synthèse attendue

```text
un modèle SAM valide n'est pas forcément sécurisé
une fonction Lambda doit avoir un rôle IAM minimal
les journaux doivent avoir une rétention définie
cfn-lint et Checkov sont complémentaires
le déploiement serverless crée aussi des ressources IAM
sam delete ne supprime pas le bucket d'artefacts SAM
```
