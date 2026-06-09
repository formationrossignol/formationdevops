---
title: "TP 20 : LocalStack"
description: Simuler des services AWS localement avec LocalStack et Terraform.
---

## Objectif

Simuler des services AWS localement avec LocalStack et Terraform.

Ce TP permet de voir comment :

- lancer LocalStack avec Docker
- configurer le provider AWS pour pointer vers LocalStack
- déployer des ressources EC2, S3, DynamoDB et SQS en local
- interagir avec les services via l'AWS CLI
- détruire l'infrastructure locale

LocalStack émule l'API AWS localement, sans compte AWS ni frais. Il est utilisé pour tester des configurations Terraform cloud avant tout déploiement réel.

## Prérequis

- Terraform installé
- Docker installé et lancé
- AWS CLI installé

```bash
terraform version
docker version
aws --version
```

## Construire l'environnement

Lancer LocalStack à partir de Docker :

```bash
docker run -it -p 4566:4566 localstack/localstack
```

Vérifier le bon fonctionnement de LocalStack :

```bash
curl http://localhost:4566/_localstack/health
```

## Utilisation des services EC2 et S3

Dans un dossier `terraform-localstack-ec2-s3`, créez un fichier `main.tf` :

```hcl
provider "aws" {
  region                      = "us-east-2"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true

  endpoints {
    s3       = "http://localhost:4566"
    ec2      = "http://localhost:4566"
    dynamodb = "http://localhost:4566"
    lambda   = "http://localhost:4566"
  }
}

resource "aws_instance" "my_ec2" {
  ami           = "ami-12345678"
  instance_type = "t2.micro"
}

output "instance_id" {
  value = aws_instance.my_ec2.id
}

resource "aws_s3_bucket" "my_bucket" {
  bucket = "my-local-bucket"
}

output "bucket_name" {
  value = aws_s3_bucket.my_bucket.id
}
```

Déployer l'infrastructure :

```bash
terraform init
terraform plan
terraform apply -auto-approve
```

Lister les buckets S3 créés :

```bash
aws --endpoint-url=http://localhost:4566 s3 ls
```

Voir l'instance EC2 :

```bash
aws --endpoint-url=http://localhost:4566 ec2 describe-instances
```

Uploader un fichier :

```bash
echo "Hello World" > test.txt
aws --endpoint-url=http://localhost:4566 s3 cp test.txt s3://my-local-bucket/
aws --endpoint-url=http://localhost:4566 s3 ls s3://my-local-bucket/
```

Supprimer l'infrastructure :

```bash
terraform destroy -auto-approve
```

## Stockage et Requêtes DynamoDB

Dans un dossier `terraform-localstack-dynamodb`, créez un fichier `main.tf` :

```hcl
provider "aws" {
  region                      = "us-east-2"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    dynamodb = "http://localhost:4566"
  }
}

resource "aws_dynamodb_table" "users" {
  name         = "Users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }
}

output "table_name" {
  value = aws_dynamodb_table.users.name
}
```

Déployer et tester :

```bash
terraform init
terraform plan
terraform apply -auto-approve
```

Ajout de données :

```bash
aws --endpoint-url=http://localhost:4566 dynamodb put-item \
  --table-name Users \
  --item '{"user_id": {"S": "123"}, "name": {"S": "Alice"}}'
```

Vérifier la région par défaut configurée :

```bash
cat ~/.aws/config
```

Récupérer un utilisateur :

```bash
aws --endpoint-url=http://localhost:4566 dynamodb get-item \
  --table-name Users \
  --key '{"user_id": {"S": "123"}}'
```

Supprimer l'infrastructure :

```bash
terraform destroy -auto-approve
```

## Utilisation du service SQS

Dans un dossier `terraform-localstack-sns`, créez un fichier `main.tf` :

```hcl
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    ec2 = "http://localhost:4566"
    sqs = "http://localhost:4566"
  }
}

resource "aws_sqs_queue" "my_queue" {
  name = "my-queue"
}

output "queue_url" {
  value = aws_sqs_queue.my_queue.url
}
```

Déployer et tester :

```bash
terraform init
terraform plan
terraform apply -auto-approve
```

Envoyer un message :

```bash
aws --endpoint-url=http://localhost:4566 sqs send-message \
  --queue-url $(terraform output -raw queue_url) \
  --message-body "Message de test"
```

Lire les messages :

```bash
aws --endpoint-url=http://localhost:4566 sqs receive-message \
  --queue-url $(terraform output -raw queue_url)
```

Supprimer l'infrastructure :

```bash
terraform destroy -auto-approve
```

## Services disponibles (version community)

- **AWS Lambda** : Création, déploiement et invocation de fonctions.
- **Amazon S3** : Opérations CRUD sur buckets et objets.
- **Amazon DynamoDB** : Tables NoSQL avec lecture/écriture.
- **Amazon SQS** : Files de messages.
- **Amazon SNS** : Notifications et abonnements.
- **Amazon Kinesis** : Flux de données en temps réel.
- **AWS CloudFormation** : Orchestration via templates.
- **Amazon API Gateway** : Création et gestion d'API REST.
- **AWS Step Functions** : Workflows d'orchestration.
- **AWS Secrets Manager** : Gestion des secrets.
