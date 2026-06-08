---
title: "TP 0 : Mise en place de l'environnement"
description: Installation des outils nécessaires pour la formation Terraform.
---

_Vous pouvez utiliser Powershell en mode admin_

## Installer Chocolatey

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(''))
```

## Installer Terraform

```bash
choco install terraform
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
