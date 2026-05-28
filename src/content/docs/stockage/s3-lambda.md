---
title: "TP : Traitement d'images avec Lambda et S3"
description: Créer un système serverless de traitement automatique d'images qui redimensionne les fichiers uploadés sur S3 via Lambda et Pillow.
---

## Objectif

Créer un système serverless de traitement automatique d'images qui redimensionne et optimise les images uploadées sur S3. À la fin du TP, vous aurez une architecture event-driven qui traite automatiquement chaque image uploadée sans gérer de serveur.

## Compétences travaillées

- Création de fonctions Lambda
- Triggers S3 pour événements
- Traitement d'images avec Pillow (Python)
- Gestion des permissions IAM pour Lambda
- Variables d'environnement Lambda
- Logs CloudWatch
- Architecture serverless event-driven

## Architecture cible

```
Utilisateur
    |
    | Upload image
    v
S3 Bucket Source (images-source)
    |
    | Événement s3:ObjectCreated:*
    v
Lambda Function (image-processor)
    |
    | Télécharge, redimensionne, optimise
    v
S3 Bucket Destination (images-processed)
    |
    +-- thumbnails/ (300x300)
    +-- medium/ (800x600)
    +-- large/ (1920x1080)
```

## Durée estimée

1 heure

## Coût

100% Free Tier compatible

- Lambda : 1M requêtes/mois + 400 000 GB-secondes
- S3 : 5 GB stockage, 20 000 GET, 2 000 PUT
- CloudWatch Logs : 5 GB/mois

---

## Étape 1 : Créer les buckets S3

### Bucket source

1. S3 → **Create bucket**
2. Bucket name : `images-source-ACCOUNT-ID`

```bash
aws sts get-caller-identity --query Account --output text
# Exemple : 123456789012
```

3. Region : eu-west-3
4. Block Public Access : COCHÉ
5. Create bucket

### Bucket destination

1. Create bucket
2. Bucket name : `images-processed-123456789012`
3. Mêmes paramètres
4. Create bucket

---

## Étape 2 : Créer le rôle IAM pour Lambda

### 2.1 Policy S3 personnalisée

1. IAM → Policies → **Create policy** → JSON

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ReadSourceBucket",
            "Effect": "Allow",
            "Action": ["s3:GetObject", "s3:ListBucket"],
            "Resource": [
                "arn:aws:s3:::images-source-123456789012",
                "arn:aws:s3:::images-source-123456789012/*"
            ]
        },
        {
            "Sid": "WriteDestinationBucket",
            "Effect": "Allow",
            "Action": ["s3:PutObject", "s3:PutObjectAcl"],
            "Resource": ["arn:aws:s3:::images-processed-123456789012/*"]
        }
    ]
}
```

> Remplacez `123456789012` par votre Account ID.

Policy name : `Lambda-S3-ImageProcessor-Policy`

### 2.2 Rôle Lambda

1. IAM → Roles → **Create role**
2. Trusted entity : AWS service → Lambda
3. Permissions :
   - `AWSLambdaBasicExecutionRole`
   - `Lambda-S3-ImageProcessor-Policy`
4. Role name : `Lambda-ImageProcessor-Role`

---

## Étape 3 : Créer la fonction Lambda

1. Lambda → **Create function** → Author from scratch

| Paramètre | Valeur |
|-----------|--------|
| Function name | ImageProcessor |
| Runtime | Python 3.11 |
| Architecture | x86_64 |
| Execution role | Lambda-ImageProcessor-Role |

---

## Étape 4 : Ajouter le layer Pillow

1. Dans la fonction → **Layers** → **Add a layer**
2. Specify an ARN :

```
arn:aws:lambda:us-east-1:770693421928:layer:Klayers-p312-Pillow:11
```

> Source : Keith's Layers (Klayers), une source fiable de layers publics AWS.

---

## Étape 5 : Écrire le code Lambda

Remplacez le code de `lambda_function.py` :

```python
import json
import boto3
import os
from PIL import Image
from io import BytesIO
from urllib.parse import unquote_plus
from datetime import datetime

s3_client = boto3.client('s3')

SIZES = {
    'thumbnail': (300, 300),
    'medium': (800, 600),
    'large': (1920, 1080)
}

def lambda_handler(event, context):
    destination_bucket = os.environ.get('DESTINATION_BUCKET')
    if not destination_bucket:
        raise ValueError("Variable DESTINATION_BUCKET non définie")
    
    for record in event['Records']:
        source_bucket = record['s3']['bucket']['name']
        source_key = unquote_plus(record['s3']['object']['key'])
        source_size = record['s3']['object']['size']
        
        print(f"Traitement: s3://{source_bucket}/{source_key}")
        
        if source_key.startswith('processed/') or not is_image(source_key):
            continue
        
        if source_size > 10 * 1024 * 1024:
            print(f"Fichier trop volumineux (> 10 MB), ignoré")
            continue
        
        response = s3_client.get_object(Bucket=source_bucket, Key=source_key)
        image_data = response['Body'].read()
        
        image = Image.open(BytesIO(image_data))
        original_format = image.format or 'JPEG'
        
        print(f"Image: {image.size}, format: {original_format}")
        
        # Conversion RGB si nécessaire (PNG avec transparence)
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            if image.mode in ('RGBA', 'LA'):
                background.paste(image, mask=image.split()[-1])
            else:
                background.paste(image)
            image = background
        
        filename = os.path.splitext(os.path.basename(source_key))[0]
        extension = get_extension(original_format)
        
        for size_name, dimensions in SIZES.items():
            resized = image.copy()
            resized.thumbnail(dimensions, Image.Resampling.LANCZOS)
            
            buffer = BytesIO()
            resized.save(buffer, format=original_format, quality=85, optimize=True)
            buffer.seek(0)
            
            dest_key = f"{size_name}/{filename}_{dimensions[0]}x{dimensions[1]}{extension}"
            
            s3_client.put_object(
                Bucket=destination_bucket,
                Key=dest_key,
                Body=buffer,
                ContentType=f'image/{original_format.lower()}',
                Metadata={
                    'original-file': source_key,
                    'processed-at': datetime.now().isoformat()
                }
            )
            
            print(f"Créé: {size_name} ({resized.size[0]}x{resized.size[1]})")
    
    return {'statusCode': 200, 'body': json.dumps('Traitement terminé')}

def is_image(key):
    return any(key.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'])

def get_extension(format):
    return {
        'JPEG': '.jpg', 'PNG': '.png', 'GIF': '.gif', 'BMP': '.bmp', 'WEBP': '.webp'
    }.get(format, '.jpg')
```

Cliquez sur **Deploy**.

---

## Étape 6 : Configurer la fonction

### Variables d'environnement

1. Configuration → Environment variables → **Edit** → Add

| Key | Value |
|-----|-------|
| DESTINATION_BUCKET | images-processed-123456789012 |

### Mémoire et timeout

1. Configuration → General configuration → **Edit**

| Paramètre | Valeur |
|-----------|--------|
| Memory | 512 MB |
| Timeout | 1 min 0 sec |

---

## Étape 7 : Configurer le trigger S3

1. Configuration → Triggers → **Add trigger**

| Paramètre | Valeur |
|-----------|--------|
| Source | S3 |
| Bucket | images-source-123456789012 |
| Event types | All object create events |

> Cochez la case d'avertissement (on utilise 2 buckets différents, pas de risque de boucle).

---

## Étape 8 : Tester

1. S3 → `images-source-123456789012` → **Upload** une image JPG ou PNG
2. Lambda → ImageProcessor → **Monitor** → View CloudWatch logs

Logs attendus :

```
Traitement: s3://images-source-123456789012/photo.jpg
Image: (4000, 3000), format: JPEG
Créé: thumbnail (300x225)
Créé: medium (800x600)
Créé: large (1920x1440)
```

3. S3 → `images-processed-123456789012` → vérifiez les dossiers `thumbnail/`, `medium/`, `large/`

---

## BONUS : Extensions possibles

### Filigrane

```python
from PIL import ImageDraw

def add_watermark(image, text="© Mon Site"):
    draw = ImageDraw.Draw(image)
    w, h = image.size
    draw.rectangle([(w-200, h-40), (w, h)], fill=(0, 0, 0, 128))
    draw.text((w-190, h-30), text, fill=(255, 255, 255, 255))
    return image
```

### Notification SNS après traitement

```python
sns = boto3.client('sns')
sns.publish(
    TopicArn=os.environ.get('SNS_TOPIC_ARN'),
    Subject='Image traitée',
    Message=f"Image {source_key} traitée avec succès"
)
```

### Métadonnées dans DynamoDB

```python
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ProcessedImages')
table.put_item(Item={
    'ImageId': filename,
    'ProcessedAt': datetime.now().isoformat(),
    'Sizes': list(SIZES.keys())
})
```

---

## Nettoyage

1. Lambda → ImageProcessor → Configuration → Triggers → **Delete** le trigger S3
2. Lambda → Functions → **Delete** ImageProcessor
3. S3 : videz et supprimez les 2 buckets
4. IAM → Roles → Supprimez `Lambda-ImageProcessor-Role`
5. IAM → Policies → Supprimez `Lambda-S3-ImageProcessor-Policy`

---

## Points clés

1. Lambda est serverless : pas de serveur à gérer
2. Free Tier : 1M requêtes/mois + 400 000 GB-secondes
3. Les triggers S3 déclenchent Lambda automatiquement
4. Les layers ajoutent des bibliothèques externes (Pillow)
5. `BytesIO` évite d'écrire sur disque
6. Timeout et mémoire impactent les performances et coûts
7. Architecture event-driven = découplage et scalabilité automatique
