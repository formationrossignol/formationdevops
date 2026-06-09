---
title: "TP 0 : Mise en place de l'environnement"
description: Installation des outils nécessaires pour la formation Terraform.
---

> **Prérequis** : [Docker Desktop](https://www.docker.com/products/docker-desktop/) doit être installé et en cours d'exécution avant de démarrer les TP Docker, Kind et LocalStack.

## Gestionnaire de paquets

### Windows : Chocolatey

Ouvrir PowerShell en mode administrateur, puis exécuter :

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

Vérifier :

```powershell
choco --version
```

### macOS : Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Vérifier :

```bash
brew --version
```

## Terraform

### Windows

```powershell
choco install terraform
```

### macOS

```bash
brew tap hashicorp/tap && brew install hashicorp/tap/terraform
```

### Linux

```bash
sudo apt-get update && sudo apt-get install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt-get update && sudo apt-get install terraform
```

Vérifier :

```bash
terraform version
```

## OpenTofu

OpenTofu est l'alternative open source à Terraform (TP 13).

### Windows

```powershell
choco install opentofu
```

### macOS

```bash
brew install opentofu
```

### Linux

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://get.opentofu.org/install-opentofu.sh | sudo sh -s -- --install-method deb
```

Vérifier :

```bash
tofu version
```

## kubectl

### Windows

```powershell
choco install kubernetes-cli
```

### macOS

```bash
brew install kubectl
```

### Linux

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

Vérifier :

```bash
kubectl version --client
```

## Kind (Kubernetes in Docker)

### Windows

```powershell
choco install kind
```

### macOS

```bash
brew install kind
```

### Linux

```bash
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.26.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

Vérifier :

```bash
kind version
```

## Helm

### Windows

```powershell
choco install kubernetes-helm
```

### macOS

```bash
brew install helm
```

### Linux

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

Vérifier :

```bash
helm version
```

## k9s

### Windows

```powershell
choco install k9s
```

### macOS

```bash
brew install k9s
```

### Linux

```bash
curl -sS https://webinstall.dev/k9s | bash
```

Vérifier :

```bash
k9s version
```

## Trivy

Trivy est utilisé pour scanner le code Terraform (TP 11).

### Windows

```powershell
choco install trivy
```

### macOS

```bash
brew install trivy
```

### Linux

```bash
sudo apt-get install wget apt-transport-https gnupg
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo deb https://aquasecurity.github.io/trivy-repo/deb generic main | sudo tee /etc/apt/sources.list.d/trivy.list
sudo apt-get update && sudo apt-get install trivy
```

Vérifier :

```bash
trivy --version
```

## Infracost

Infracost est utilisé pour estimer les coûts d'infrastructure (TP 12).

### Windows

```powershell
choco install infracost
```

### macOS

```bash
brew install infracost
```

### Linux

```bash
curl -fsSL https://raw.githubusercontent.com/infracost/infracost/master/scripts/install.sh | sh
```

Vérifier et configurer (clé API gratuite requise) :

```bash
infracost --version
infracost auth login
```

## jq

jq est utilisé pour parser les rapports JSON d'Infracost (TP 12).

### Windows

```powershell
choco install jq
```

### macOS

```bash
brew install jq
```

### Linux

```bash
sudo apt-get install jq
```

Vérifier :

```bash
jq --version
```

## Vérification globale

### Windows

```powershell
terraform version
tofu version
docker version
kubectl version --client
kind version
helm version
k9s version
trivy --version
infracost --version
jq --version
```

### macOS / Linux

```bash
terraform version
tofu version
docker version
kubectl version --client
kind version
helm version
k9s version
trivy --version
infracost --version
jq --version
```
