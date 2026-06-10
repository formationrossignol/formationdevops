---
title: "TP : Infrastructure as Code avec CloudFormation"
date: 2026-05-28
description: Créer des templates YAML CloudFormation, déployer des stacks avec S3 et Lambda, gérer les mises à jour avec les change sets.
---

## Objectif

Maîtriser les bases de l'Infrastructure as Code avec AWS CloudFormation en créant des templates YAML, déployant des stacks avec plusieurs ressources AWS (S3, Lambda, IAM) et gérant les mises à jour pour une infrastructure reproductible.

## Compétences travaillées

- Écriture de templates CloudFormation en YAML
- Syntaxe et structure CloudFormation
- Déploiement de stacks
- Paramètres et outputs
- Fonctions intrinsèques
- Gestion des dépendances entre ressources
- Mises à jour avec change sets
- Rollback automatique
- Bonnes pratiques IaC

## Architecture cible

```
CloudFormation Stack
    |
    +-- S3 Bucket (stockage)
    |   +-- Versioning activé
    |   +-- Encryption activée
    |
    +-- Lambda Function
    |   +-- Runtime: Python 3.11
    |   +-- Trigger: S3 upload
    |
    +-- IAM Role (pour Lambda)
        +-- Policy: accès S3 et CloudWatch Logs
```

## Durée estimée

1 heure 30 minutes

## Coût

100% Free Tier compatible

- CloudFormation : Gratuit
- S3 : 5 GB gratuit
- Lambda : 1M requêtes/mois gratuit

---

## Étape 1 : Comprendre la structure d'un template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Description du template

Parameters:
  # Entrées paramétrables

Resources:
  # Ressources AWS à créer (OBLIGATOIRE)

Outputs:
  # Valeurs à retourner après déploiement
```

**Fonctions intrinsèques essentielles :**

| Fonction | Usage | Exemple |
|----------|-------|---------|
| `!Ref` | Référence une ressource ou un paramètre | `!Ref MonBucket` |
| `!GetAtt` | Attribut d'une ressource | `!GetAtt MonBucket.Arn` |
| `!Sub` | Substitution de variables | `!Sub '${ProjectName}-bucket'` |
| `!Join` | Concaténation | `!Join ['-', [a, b, c]]` |
| `!FindInMap` | Valeur dans un mapping | `!FindInMap [Map, Key1, Key2]` |
| `!If` | Condition | `!If [Condition, True, False]` |

---

## Étape 2 : Template S3 simple

Créez un fichier `s3-simple.yaml` :

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Template CloudFormation simple - Bucket S3

Resources:
  MonPremierBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: tp-cloudformation-bucket-2026
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: Formation
        - Key: ManagedBy
          Value: CloudFormation

Outputs:
  BucketName:
    Description: Nom du bucket S3 créé
    Value: !Ref MonPremierBucket
  
  BucketArn:
    Description: ARN du bucket S3
    Value: !GetAtt MonPremierBucket.Arn
```

> Le nom du bucket doit être unique globalement. Modifiez `tp-cloudformation-bucket-2026`.

### Déployer la stack

1. CloudFormation → **Create stack** → With new resources
2. Upload `s3-simple.yaml`
3. Stack name : `tp-s3-stack`
4. Submit

**Events attendus :**

```
CREATE_IN_PROGRESS  AWS::S3::Bucket       MonPremierBucket
CREATE_COMPLETE     AWS::S3::Bucket       MonPremierBucket
CREATE_COMPLETE     AWS::CloudFormation::Stack  tp-s3-stack
```

---

## Étape 3 : Template avec paramètres

Créez `s3-parametres.yaml` :

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Template CloudFormation avec paramètres

Parameters:
  BucketNamePrefix:
    Type: String
    Default: tp-cloudformation
    AllowedPattern: '^[a-z0-9-]*$'
  
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, prod]
  
  EnableVersioning:
    Type: String
    Default: 'true'
    AllowedValues: ['true', 'false']

Conditions:
  EnableVersioningCondition: !Equals [!Ref EnableVersioning, 'true']

Resources:
  MonBucketParametre:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${BucketNamePrefix}-${Environment}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: !If [EnableVersioningCondition, Enabled, Suspended]
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Environment
          Value: !Ref Environment

Outputs:
  BucketName:
    Value: !Ref MonBucketParametre
    Export:
      Name: !Sub '${AWS::StackName}-BucketName'
```

Déployez avec stack name `tp-s3-parametres-stack`.

---

## Étape 4 : Stack complète S3 + Lambda

Créez `s3-lambda-complete.yaml` :

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Stack complete S3 + Lambda avec trigger

Parameters:
  ProjectName:
    Type: String
    Default: tp-cloudformation
  
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, prod]

Resources:
  SourceBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-source-${Environment}-${AWS::AccountId}'
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt ProcessorFunction.Arn

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ProcessorFunction
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceArn: !GetAtt SourceBucket.Arn

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-lambda-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: [s3:GetObject, s3:PutObject]
                Resource: !Sub '${SourceBucket.Arn}/*'

  ProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${ProjectName}-processor-${Environment}'
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 60
      MemorySize: 256
      Environment:
        Variables:
          BUCKET_NAME: !Ref SourceBucket
          ENVIRONMENT: !Ref Environment
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          
          s3 = boto3.client('s3')
          
          def lambda_handler(event, context):
              for record in event['Records']:
                  bucket = record['s3']['bucket']['name']
                  key = record['s3']['object']['key']
                  print(f"Fichier uploadé: {key} dans {bucket}")
              return {'statusCode': 200, 'body': json.dumps('OK')}

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${ProcessorFunction}'
      RetentionInDays: 7

Outputs:
  BucketName:
    Value: !Ref SourceBucket
    Export:
      Name: !Sub '${AWS::StackName}-BucketName'
  
  LambdaFunctionArn:
    Value: !GetAtt ProcessorFunction.Arn
```

### Déployer la stack complète

1. CloudFormation → Create stack
2. Upload `s3-lambda-complete.yaml`
3. Stack name : `tp-s3-lambda-stack`
4. Parameters : ProjectName = `demo-app`, Environment = `dev`
5. Cochez : **I acknowledge that AWS CloudFormation might create IAM resources**
6. Submit

---

## Étape 5 : Mettre à jour avec un Change Set

Les change sets permettent de prévisualiser les modifications avant de les appliquer.

1. CloudFormation → `tp-s3-lambda-stack`
2. Stack actions → **Create change set for current stack**
3. Uploadez le template modifié
4. Change set name : `update-lambda-config`
5. Submit

**Onglet Changes :**

| Action | Logical ID | Type | Replacement |
|--------|------------|------|-------------|
| Modify | ProcessorFunction | AWS::Lambda::Function | False |

6. **Execute change set** → Confirm

---

## Étape 6 : Fonctions avancées

### Mappings et conditions

```yaml
Mappings:
  EnvironmentConfig:
    dev:
      BucketRetention: 7
      LogLevel: DEBUG
    prod:
      BucketRetention: 90
      LogLevel: ERROR

Conditions:
  IsProduction: !Equals [!Ref Environment, prod]

Resources:
  DemoBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'demo-${Environment}-${AWS::AccountId}'
      LifecycleConfiguration:
        Rules:
          - Id: ExpireOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: !FindInMap
              - EnvironmentConfig
              - !Ref Environment
              - BucketRetention

  # Bucket uniquement en production
  BackupBucket:
    Type: AWS::S3::Bucket
    Condition: IsProduction
    Properties:
      BucketName: !Sub 'backup-${AWS::AccountId}'
```

---

## Étape 7 : Bonnes pratiques

```yaml
Resources:
  MainBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain          # Protection contre la suppression accidentelle
    UpdateReplacePolicy: Retain     # Protection lors des mises à jour
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Environment
          Value: !Ref Environment
```

**`DeletionPolicy: Retain`** : le bucket persiste même si la stack est supprimée.

---

## Comparaison : CloudFormation vs Terraform vs CDK

| Critère | CloudFormation | Terraform | AWS CDK |
|---------|---------------|-----------|---------|
| Langage | YAML/JSON | HCL | TypeScript/Python |
| Gratuit | Oui | Oui | Oui |
| Multi-cloud | Non (AWS only) | Oui | Non (AWS only) |
| Gestion d'état | AWS managed | Fichier state | CloudFormation |
| Courbe d'apprentissage | Moyenne | Moyenne | Haute |

---

## Nettoyage

1. CloudFormation → `tp-s3-lambda-stack` → **Delete** (videz d'abord le bucket S3)
2. Supprimez `tp-s3-stack` et `tp-s3-parametres-stack`

---

## Points clés

1. CloudFormation est 100% gratuit (vous payez uniquement les ressources créées)
2. `Resources` est la seule section obligatoire
3. `!Ref` retourne l'ID, `!GetAtt` retourne des attributs spécifiques
4. Les paramètres rendent les templates réutilisables
5. Les change sets prévisualisent les modifications
6. Rollback automatique en cas d'erreur
7. `DeletionPolicy: Retain` protège les données critiques
8. Les exports permettent de partager des valeurs entre stacks
