---
title: "TP 0 : Mise en place de l'environnement"
description: Installation des outils nécessaires pour la formation Terraform.
---

_Vous pouvez utiliser Powershell en mode admin_

> **Pré-requis** : [Docker Desktop](https://www.docker.com/products/docker-desktop/) doit être installé et en cours d'exécution avant de démarrer les TP Kind, Docker et LocalStack.

## Installer Chocolatey

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

## Installer Terraform

```bash
choco install terraform
```

## Installer kubectl

```bash
choco install kubernetes-cli
```

## Installer Kind (Kubernetes in Docker)

```bash
choco install kind
```

## Installer Helm

```bash
choco install kubernetes-helm
```

## Installer k9s

```bash
choco install k9s
```
