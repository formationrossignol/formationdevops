---
title: "TP 5 : Provider Docker de Terraform"
description: Gérer images, conteneurs, réseaux et volumes Docker avec Terraform.
---

## Préparer l'environnement Terraform

Créez un répertoire pour votre projet :

```bash
mkdir terraform-docker-tp
cd terraform-docker-tp
```

Créez un fichier `main.tf` avec le provider Docker :

```hcl
terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }

  required_version = ">= 1.5.0"
}

provider "docker" {}
```

## Gérer les images Docker

Ajoutez une ressource pour télécharger une image Docker :

```hcl
resource "docker_image" "nginx_image" {
  name         = "nginx:stable"
  keep_locally = true
}
```

Initialisez et appliquez :

```bash
terraform init
terraform apply
docker images
```

## Créer un conteneur

```hcl
resource "docker_container" "nginx_container" {
  image = docker_image.nginx_image.name
  name  = "nginx-container"
  ports {
    internal = 80
    external = 8080
  }
}
```

Appliquez et vérifiez :

```bash
terraform apply
docker ps
curl http://localhost:8080
```

## Ajouter un réseau Docker

```hcl
resource "docker_network" "custom_network" {
  name = "custom-network"
}
```

Connectez le conteneur au réseau :

```hcl
resource "docker_container" "nginx_container" {
  name  = "nginx-container"
  image = docker_image.nginx_image.latest

  ports {
    internal = 80
    external = 8080
  }

  networks_advanced {
    name = docker_network.custom_network.name
  }
}
```

Appliquez et vérifiez :

```bash
terraform apply
docker network ls
docker network inspect custom-network
```

## Créer un volume Docker

```hcl
resource "docker_volume" "nginx_volume" {
  name = "nginx-data"
}
```

Montez le volume dans le conteneur :

```hcl
resource "docker_container" "nginx_container" {
  name  = "nginx-container"
  image = docker_image.nginx_image.latest

  ports {
    internal = 80
    external = 8080
  }

  networks_advanced {
    name = docker_network.custom_network.name
  }

  volumes {
    container_path = "/usr/share/nginx/html"
    volume_name    = docker_volume.nginx_volume.name
  }
}
```

Pour Windows :

```hcl
resource "docker_container" "nginx_container" {
  name  = "nginx-container"
  image = docker_image.nginx_image.latest

  ports {
    internal = 80
    external = 8080
  }

  networks_advanced {
    name = docker_network.custom_network.name
  }

  mounts {
    source = "C:/docker-data/nginx"
    target = "/usr/share/nginx/html"
    type   = "bind"
  }
}
```

Appliquez et testez la persistance :

```bash
terraform apply
docker volume ls
docker volume inspect nginx-data
echo "Hello Terraform!" > /var/lib/docker/volumes/nginx-data/_data/index.html
curl http://localhost:8080
```

## Supprimer les ressources

```bash
terraform destroy
```
