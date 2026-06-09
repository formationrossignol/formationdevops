---
title: "TP 8 : Détecter une dérive avec Docker"
description: Comprendre ce que Terraform détecte lorsqu'une ressource gérée est modifiée manuellement.
---

## Objectif

Comprendre ce que Terraform détecte lorsqu'une ressource gérée par Terraform est modifiée manuellement.

Ce TP permet de voir :

- la différence entre la configuration Terraform, le state et l'état réel
- le rôle de `terraform plan`
- ce que Terraform détecte après une modification manuelle
- ce que Terraform ne détecte pas forcément
- comment remettre l'infrastructure dans l'état attendu

## Principe

Terraform compare trois éléments :

| Élément | Rôle |
|---|---|
| Configuration `.tf` | Ce qui est demandé dans le code |
| State Terraform | Ce que Terraform pense gérer |
| État réel | Ce qui existe réellement dans Docker |

Une dérive apparaît quand l'état réel ne correspond plus à ce qui est décrit dans la configuration Terraform.

## Prérequis

- Terraform installé
- Docker installé et lancé
- Un terminal et un éditeur de code

Vérifier :

```bash
terraform version
docker version
```

## Arborescence

```
tp-terraform-drift/
├── main.tf
├── variables.tf
├── outputs.tf
└── .gitignore
```

## Fichier `.gitignore`

```
.terraform/
*.tfstate
*.tfstate.*
.terraform.lock.hcl
*.tfvars
```

## Fichier `variables.tf`

```hcl
variable "container_name" {
  description = "Nom du conteneur Docker"
  type        = string
  default     = "tp-drift-nginx"
}

variable "image_name" {
  description = "Image Docker utilisée"
  type        = string
  default     = "nginx:latest"
}

variable "external_port" {
  description = "Port exposé sur la machine locale"
  type        = number
  default     = 8080
}
```

## Fichier `main.tf`

```hcl
terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

provider "docker" {}

resource "docker_image" "nginx" {
  name = var.image_name
}

resource "docker_container" "web" {
  name  = var.container_name
  image = docker_image.nginx.image_id

  ports {
    internal = 80
    external = var.external_port
  }
}
```

## Fichier `outputs.tf`

```hcl
output "container_name" {
  description = "Nom du conteneur Docker"
  value       = docker_container.web.name
}

output "application_url" {
  description = "URL locale de l'application"
  value       = "http://localhost:${var.external_port}"
}
```

## Étape 1 : initialiser Terraform

```bash
terraform init
```

## Étape 2 : vérifier la configuration

```bash
terraform fmt
terraform validate
```

## Étape 3 : créer le conteneur

```bash
terraform plan
terraform apply
```

Confirmer avec :

```
yes
```

Tester :

```bash
curl http://localhost:8080
```

Vérifier avec Docker :

```bash
docker ps
```

Le conteneur `tp-drift-nginx` doit apparaître.

## Étape 4 : observer le state Terraform

Lister les ressources suivies par Terraform :

```bash
terraform state list
```

Résultat attendu :

```
docker_container.web
docker_image.nginx
```

Afficher le détail du conteneur :

```bash
terraform state show docker_container.web
```

## Étape 5 : première dérive — arrêter le conteneur manuellement

Arrêter le conteneur sans passer par Terraform :

```bash
docker stop tp-drift-nginx
```

Vérifier — le conteneur est arrêté mais existe toujours :

```bash
docker ps      # conteneur absent
docker ps -a   # conteneur visible avec le statut Exited
```

Puis lancer :

```bash
terraform plan
```

> **Comportement attendu** : le provider `kreuzwerker/docker` ne suit pas l'état running/stopped d'un conteneur — uniquement son existence. Terraform peut donc afficher `No changes` même si le conteneur est arrêté. C'est une limite du provider Docker, pas un bug Terraform.
>
> C'est un exemple de ce que Terraform **ne détecte pas forcément** : un arrêt manuel n'est pas une dérive visible dans le state si le provider ne modélise pas cet attribut.

Supprimer le conteneur arrêté pour continuer le TP :

```bash
docker rm tp-drift-nginx
terraform apply
```

## Étape 6 : deuxième dérive — supprimer le conteneur manuellement

Supprimer le conteneur hors Terraform :

```bash
docker rm -f tp-drift-nginx
```

Puis lancer :

```bash
terraform plan
```

Cette fois, Terraform détecte que la ressource `docker_container.web` n'existe plus réellement et propose de la recréer (`+ create`).

Appliquer :

```bash
terraform apply
```

Vérifier :

```bash
docker ps
```

> C'est la dérive la plus simple et la plus courante : une ressource supprimée hors Terraform. Le state indique qu'elle existe, l'état réel dit qu'elle n'existe pas — Terraform la recrée.

## Étape 7 : troisième dérive — remplacer le conteneur par un autre

Supprimer le conteneur Terraform :

```bash
docker rm -f tp-drift-nginx
```

Créer un conteneur manuel avec le même nom mais une autre image :

```bash
docker run -d --name tp-drift-nginx -p 8080:80 httpd:latest
```

Puis exécuter :

```bash
terraform plan
```

Terraform compare son state (qui décrit un conteneur `nginx:latest`) avec ce qui existe réellement (un conteneur `httpd:latest`). Il doit proposer un remplacement ou une modification.

> **Attention lors de l'`apply`** : Terraform va tenter de supprimer le conteneur existant avant d'en créer un nouveau. S'il ne parvient pas à supprimer le conteneur manuel (permissions, etc.), l'`apply` échouera. Le comportement est normal — Terraform reprend le contrôle de la ressource.

Appliquer pour rétablir l'état attendu :

```bash
terraform apply
```

## Étape 8 : ressource créée hors Terraform

Créer un conteneur totalement hors Terraform :

```bash
docker run -d --name manuel-nginx -p 8090:80 nginx:latest
```

Puis lancer :

```bash
terraform plan
```

Terraform ne propose pas de supprimer `manuel-nginx` — ce conteneur n'est pas dans son state, il ne le connaît pas.

> **Point important** : Terraform ne gère que les ressources enregistrées dans son state. Une ressource créée hors Terraform est invisible pour lui. Pour qu'il commence à la gérer, il faudrait utiliser `terraform import`.

Nettoyer le conteneur manuel :

```bash
docker rm -f manuel-nginx
```

## Étape 9 : utiliser `terraform plan -refresh-only`

Afficher uniquement les changements d'état détectés, sans planifier de modification d'infrastructure :

```bash
terraform plan -refresh-only
```

Appliquer uniquement la mise à jour du state :

```bash
terraform apply -refresh-only
```

Cette option permet de synchroniser le state avec l'état réel sans modifier l'infrastructure. Utile pour diagnostiquer une dérive avant de décider quoi faire.

> **Note** : la commande `terraform refresh` existe mais est dépréciée depuis Terraform 1.5. Préférer systématiquement `terraform plan -refresh-only` et `terraform apply -refresh-only`.

## Étape 10 : corriger une dérive

Selon la situation, plusieurs approches sont possibles :

| Situation | Action recommandée |
|---|---|
| L'état réel a été modifié par erreur | `terraform apply` pour rétablir l'état décrit dans le code |
| L'état réel est désormais correct et le code doit s'y conformer | Modifier le code Terraform pour correspondre à la réalité, puis `terraform apply -refresh-only` |
| La ressource ne doit plus être gérée par Terraform (sans la supprimer) | `terraform state rm <ressource>` — supprime la ressource du state uniquement, **pas de l'infrastructure** |
| Une ressource existante doit être prise en charge par Terraform | `terraform import <ressource> <id>` |

> `terraform state rm` retire une ressource du state Terraform sans la détruire dans l'infrastructure. Après cette commande, Terraform ne la gère plus. À utiliser avec précaution car un `terraform apply` ultérieur pourrait tenter de recréer la ressource.

## Exercice 1 : dérive sur le port

Provoquer une dérive de port sans modifier `variables.tf` — utiliser `-var` :

```bash
terraform plan -var="external_port=8081"
```

Observer si Terraform propose une modification ou un remplacement du conteneur.

Appliquer pour voir le comportement réel :

```bash
terraform apply -var="external_port=8081"
```

Rétablir le port initial :

```bash
terraform apply
```

## Exercice 2 : dérive sur l'image

Provoquer une dérive d'image :

```bash
terraform plan -var="image_name=httpd:latest"
terraform apply -var="image_name=httpd:latest"
```

Observer comment Terraform traite le changement d'image — destruction et recréation du conteneur, ou modification en place ?

Rétablir l'image initiale :

```bash
terraform apply
```

## Exercice 3 : comparer plusieurs commandes

Tester les commandes suivantes dans différents scénarios de dérive :

```bash
terraform plan
terraform plan -refresh-only
terraform apply
terraform apply -refresh-only
terraform state list
terraform state show docker_container.web
```

Observer les différences de comportement selon l'état réel du conteneur.

## Nettoyage

```bash
terraform destroy
```

Confirmer avec :

```
yes
```

Vérifier qu'il ne reste aucun conteneur ou volume résiduel :

```bash
docker ps -a
docker volume ls
```
