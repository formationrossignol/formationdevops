---
title: "TP 16 : Utilisation générique de Helm"
description: Commandes Helm essentielles pour gérer des charts Kubernetes.
---

## Objectif

Maîtriser les commandes Helm essentielles pour gérer des charts Kubernetes.

Ce TP permet de voir comment :

- ajouter et mettre à jour des dépôts de charts
- rechercher et installer un chart
- personnaliser une installation avec `--set` ou un fichier `values.yaml`
- lister, mettre à jour et supprimer des releases
- créer et déployer un chart personnalisé

## Prérequis

- Helm installé
- Un cluster Kubernetes fonctionnel (Kind — voir TP 14)
- kubectl installé

```bash
helm version
kubectl version --client
kubectl cluster-info
```

## Ajouter un dépôt de charts

Helm dispose de dépôts publics contenant des charts prêts à l'emploi.

Ajouter un dépôt (par exemple, Bitnami)

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

## Rechercher un chart spécifique

```bash
helm search repo nginx
```

## Installer un chart

Pour déployer une application via Helm :

```bash
helm install <release-name> <chart-name>
```

Exemple : Installer un serveur Nginx

```bash
helm install my-nginx bitnami/nginx
```

**Par défaut, Helm déploie l'application dans le namespace default.**

### Configurer les valeurs

Vous pouvez personnaliser un chart avec des paramètres spécifiques.

Définir des paramètres directement dans la commande

```bash
helm install my-nginx bitnami/nginx --set replicaCount=2
```

### Utiliser un fichier YAML pour les valeurs

Créez un fichier `values.yaml`

```yaml
replicaCount: 2
service:
  type: LoadBalancer
```

Puis installez le chart en utilisant ce fichier

```bash
helm install my-nginx bitnami/nginx -f values.yaml
```

## Lister les releases

```bash
helm list -A
```

## Mettre à jour une release

```bash
helm upgrade <release-name> <chart-name> --set <key>=<value>
```

Exemple

```bash
helm upgrade my-nginx bitnami/nginx --set replicaCount=3
```

## Supprimer une release

```bash
helm uninstall <release-name>
```

Exemple

```bash
helm uninstall my-nginx
```

## Développer vos propres charts

Pour créer un chart personnalisé

```bash
helm create my-chart
```

Cela génère une structure de base

```
my-chart/
├── Chart.yaml
├── values.yaml
├── templates/
    ├── deployment.yaml
    ├── service.yaml
    └── ...
```

Modifiez les fichiers dans `templates/` pour adapter les ressources Kubernetes à vos besoins.

## Déployer des charts locaux

```bash
helm install my-release ./my-chart
```
