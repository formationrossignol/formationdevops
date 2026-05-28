---
theme: default
title: AWS Cloud Foundation — IAWS010
author: Loïc Rossignol
date: 2026-05-28
highlighter: shiki
lineNumbers: false
colorSchema: dark
fonts:
  sans: Inter
  mono: Fira Code
---

# AWS Cloud Foundation

IAWS010

<div class="text-gray-400 mt-4">Loïc Rossignol · 2026</div>

---
layout: two-cols
---

# À propos du formateur

**Loïc Rossignol**

- +12 ans d'expérience en IT
- Head of DevOps · Team Leader
- Formateur IT (IPI, YNOV, Thales)

**Formations dispensées :**
- Fondamentaux AWS
- DevOps : Docker, Ansible, Terraform
- Agilité : Scrum, Kanban
- Sécurité du cloud
- DevSecOps

::right::

<div class="mt-8">

**Disclaimer**

> Cette formation couvre les services du périmètre **AWS Certified Cloud Practitioner (CLF-C02)**, pas l'intégralité des 200+ services AWS. Les services évoluent rapidement — certains éléments peuvent changer.

**Évaluation du module**

QCM en mode examen type AWS Cloud Practitioner

</div>

---
layout: section
---

# Objectifs pédagogiques

---

# Savoir

| Domaine | Contenu |
|---------|---------|
| Fondamentaux cloud | NIST, caractéristiques, IaaS/PaaS/SaaS, déploiement public/privé/hybride |
| Adoption cloud | CAF, 6 perspectives, cloud-native, 12-Factor App |
| Écosystème AWS | Historique, pay-as-you-go, régions, AZ, accès |
| Certification | CLF-C02 : structure, domaines, positionnement |
| Calcul AWS | EC2, Lightsail, Batch, Lambda, Fargate, Elastic Beanstalk, modèles d'achat |
| Haute disponibilité | HA, résilience, scalabilité, élasticité, Auto Scaling, ELB |
| Réseau AWS | VPC, Route 53, CloudFront, sous-réseaux, SG, routage DNS |
| Sécurité AWS | Responsabilité partagée, IAM, MFA, moindre privilège, KMS, Secrets Manager |
| Supervision & coûts | CloudWatch, Service Quotas, Cost Explorer, Budgets |
| Services applicatifs | BDD, stockage, analytique, IA/ML, serverless, CI/CD |

---

# Savoir-faire

| Compétence | Description |
|------------|-------------|
| Navigation AWS | Console AWS, organisation des services |
| Accès | Console, CLI, SDK — différences d'usage |
| Calcul | Créer et configurer une instance EC2 |
| Sécurité réseau | Configurer un security group, ports usuels |
| Connexion instances | SSH, EC2 Instance Connect |
| Haute disponibilité | Multi-AZ, ELB, Auto Scaling |
| Stockage | S3, EBS, EFS, FSx, Glacier selon usages |
| Bases de données | RDS, Aurora, DynamoDB, ElastiCache, DocumentDB, Neptune |
| Serverless | Lambda, API Gateway, SQS, SNS, EventBridge, Step Functions |
| CI/CD | CodeArtifact, CodeBuild, CodeDeploy, CodePipeline, X-Ray |

---

# Savoir-être

| Posture | Description |
|---------|-------------|
| Culture cloud | Service, automatisation, scalabilité, paiement à l'usage |
| Responsabilité sécurité | Sécurité partagée entre AWS et le client |
| Esprit critique | Questionner le choix de service selon le besoin, le coût, la complexité |
| Sobriété technique | Éviter la sur-ingénierie |
| Orientation valeur | Relier les services AWS aux objectifs métier |
| Sens de la gouvernance | Accès maîtrisés, conformité, traçabilité, suivi des coûts |
| Réflexe d'observabilité | Supervision, logs, métriques, alertes |
| Amélioration continue | Well-Architected Framework, REX |
| Collaboration | Échanges cross-profils (dev, infra, sécu, data, produit) |
| Autonomie progressive | Explorer la documentation AWS, approfondir après la formation |

---
layout: section
---

# Généralités sur le Cloud Computing

Section 1

---

# Qu'est-ce que le « cloud » ?

**Définition NIST (SP 800-145)**

> Le Cloud Computing est un modèle qui permet un **accès réseau pratique et sur demande** à un pool partagé de ressources informatiques configurables (réseaux, serveurs, stockage, applications, services) qui peut être **rapidement approvisionné sans trop d'efforts de gestion**.

---

**Ce modèle est composé de :**

- **5 caractéristiques essentielles**
- **3 modèles de service** : IaaS, PaaS, SaaS
- **4 modèles de déploiement** : Public, Privé, Communautaire, Hybride

---

# Les 5 caractéristiques essentielles

<div class="grid grid-cols-1 gap-3 mt-4">

**① Libre-service à la demande** — Les utilisateurs provisionnent des ressources sans intervention humaine du service.

**② Large accès au réseau** — Ressources disponibles sur le réseau, accessibles par diverses plateformes clientes.

**③ Mise en commun des ressources** — Plusieurs clients partagent la même infrastructure avec sécurité et confidentialité (multi-tenant).

**④ Flexibilité rapide** — Acquérir et libérer automatiquement des ressources en cas de besoin. Scalabilité rapide selon la demande.

**⑤ Service mesuré** — L'utilisation est mesurée, les utilisateurs paient pour ce qu'ils ont utilisé (pay-as-you-go).

</div>

---

# Limites de l'approche traditionnelle (on-premises)

- Payer le loyer du datacenter
- Payer l'alimentation, le refroidissement, la maintenance
- L'ajout et le remplacement de matériel prennent du temps
- La mise à l'échelle (autoscaling) est limitée
- Embaucher une équipe 24h/24 7j/7 pour surveiller l'infrastructure
- Gérer les catastrophes (tremblement de terre, coupure de courant, incendie…)

---

# Les modèles de service

| Modèle | Géré par le provider | Géré par le client | Exemple |
|--------|---------------------|--------------------|---------|
| **IaaS** | Infra physique, virtualisation | OS, middleware, appli, données | EC2, VPC |
| **PaaS** | Infra + OS + middleware | Application, données | Elastic Beanstalk, RDS |
| **SaaS** | Tout | Configuration utilisateur | Gmail, Salesforce |

---

# Quelques cas d'usage du cloud

- Faire face à des **pics d'activité**
- Sauvegarder ses **données quotidiennement**
- Se libérer des **machines physiques**
- Porter des projets de **nouvelles technologies**
- Créer une **nouvelle activité**, un nouveau produit
- Déporter ses **applications d'entreprise**

---

# AWS Cloud Adoption Framework (CAF)

- Cadre AWS pour **structurer l'adoption du cloud**
- S'appuie sur les bonnes pratiques et retours d'expérience AWS
- Aide les organisations à passer du cloud « technique » au cloud « opérationnel »
- Évalue la **préparation au cloud**
- Identifie les capacités organisationnelles à renforcer
- Construit une **feuille de route cloud progressive**
- Réduit les risques et accélère la transformation

> Le CAF aide à **adopter le cloud de manière structurée**, pas seulement à migrer des serveurs.

---

# Les 6 perspectives de l'AWS CAF

| Perspective | Focus | Services clés |
|-------------|-------|---------------|
| **Business** | Valeur métier, ROI, time-to-market | AWS Budgets, Cloud Economics |
| **Personnes** | Capital humain, formation, rôles cloud | AWS Training, CCoE |
| **Gouvernance** | Pilotage, portefeuille, coûts/risques | AWS Organizations, Control Tower |
| **Plateforme** | Architecture hybride/cloud-native scalable | Terraform, Landing Zones, EC2, S3 |
| **Sécurité** | Confidentialité, identités, conformité | IAM, KMS, GuardDuty, Artifact |
| **Opérations** | Excellence opérationnelle, supervision | CloudWatch, CloudTrail, Config |

---

# Application « Cloud Native »

> Une application Cloud Native est conçue pour **exploiter pleinement le cloud** (élasticité, scalabilité, automatisation). Elle n'est pas simplement « hébergée » sur un serveur distant (≠ Lift & Shift).

**Avantages :**
- Meilleur time to market
- Scalabilité accrue
- Stack transférable entre régions
- Gestion entièrement automatisée

---

# Les 12-Factor App (Heroku)

<div class="grid grid-cols-2 gap-2 text-sm mt-2">
<div>

1. **Codebase** — Un dépôt Git, plusieurs déploiements
2. **Dependencies** — Déclarer et isoler les dépendances
3. **Config** — Variables d'environnement (pas dans le code)
4. **Backing Services** — DB, mail = ressources attachées
5. **Build, Release, Run** — Étapes strictement séparées
6. **Processes** — Stateless, stockage externe

</div>
<div>

7. **Port Binding** — L'app expose son propre port
8. **Concurrency** — Scale horizontal (Stateless)
9. **Disposability** — Démarrage rapide, arrêt propre
10. **Dev/Prod Parity** — Dev ≈ Production
11. **Logs** — Traiter les logs comme des flux
12. **Admin Processes** — Même env que l'application

</div>
</div>

---
layout: section
---

# Le Cloud AWS

Section 2

---

# Un peu d'histoire

- **2006** : Création d'AWS
- À l'époque, petit business parallèle à Amazon.com
- Né pour résoudre des **problèmes d'échelle** : Amazon a créé son système interne pour gérer sa croissance !

---

# Modèle économique

**Partager les infrastructures** en facturant le stockage et le traitement des données comme un service :

- En fonction des heures d'utilisation (facturation à la **seconde ou à la minute**)
- Volume de données traitées (transmises ou stockées)

> Comme pour l'eau ou l'électricité : **Pay As You Go (PAYG)**

---

# L'offre gratuite AWS

**3 types d'offres :**

| Type | Description |
|------|-------------|
| **Essais gratuits** | Court terme, à partir de la date d'activation |
| **12 mois gratuits** | Après la date d'inscription initiale |
| **Toujours gratuit** | N'expirent pas, disponibles pour tous les clients |

→ https://aws.amazon.com/fr/free/

---

# Avantages & Inconvénients AWS

<div class="grid grid-cols-2 gap-4 mt-4">

**✅ Avantages**
- Réseau le plus large au monde
- Grande fiabilité et sécurité
- Offre de services la plus large
- Excellente flexibilité pour tous types de projets
- Faibles coûts, facturation à l'usage
- Évolutivité des services

**❌ Inconvénients**
- Très compliqué pour les débutants
- Budget et planification des coûts difficiles
- Perte de contrôle sur les données
- Risque de panne

</div>

---

# Infrastructure globale AWS

**Répartition actuelle :**
- **39 régions** (123 zones de disponibilité)
- **245 pays et territoires** desservis
- Une région = groupement de datacenters

**Comment choisir une région ?**
- **Conformité** légale et gouvernance des données
- **Proximité** avec les clients (latence réduite)
- **Services disponibles** (tous les services ne sont pas partout)
- **Tarification** (varie selon les régions)

---

# Les Zones de Disponibilité (AZ)

- Chaque région a **plusieurs AZ** (généralement 3, entre 2 et 6)
- Chaque AZ = un ou plusieurs datacenters **séparés physiquement**
- Séparés pour résister aux catastrophes
- Connectés avec **très faible latence**

**Exemple (ap-southeast-2) :**
- `ap-southeast-2a`
- `ap-southeast-2b`
- `ap-southeast-2c`

---

# 3 façons d'interagir avec AWS

| Interface | Description |
|-----------|-------------|
| **AWS Management Console** | Interface graphique web |
| **AWS CLI** | Commandes en ligne, scripts, accès aux API publiques. Open source : github.com/aws/aws-cli |
| **AWS SDK** | Bibliothèques par langage : Python, JavaScript, Java, .NET, Go, PHP, Ruby, C++, iOS, Android |

---

# Cartographie des services (sélection)

| Catégorie | Exemples de services |
|-----------|---------------------|
| **Calcul** | EC2, Lambda, Fargate, Elastic Beanstalk |
| **Stockage** | S3, EBS, S3 Glacier |
| **Réseau / CDN** | VPC, Route 53, CloudFront |
| **Bases de données** | Aurora, RDS, DynamoDB |
| **Analyse** | Athena, Redshift, Kinesis |
| **Coûts** | Cost Explorer, Budgets |
| **Gestion / Gouvernance** | CloudWatch, CloudFormation, CloudTrail, Trusted Advisor |
| **Migration** | DMS, Snowball, DataSync |
| **Sécurité** | IAM, Inspector, Shield, Security Hub |

> Il existe **plus de 200 services** AWS !

---

# La certification AWS Certified Cloud Practitioner (CLF-C02)

- **65 questions** (choix unique + réponses multiples)
- **90 minutes**
- **Score minimum : 70 %**

| Domaine | % Examen |
|---------|----------|
| Domaine 1 : Concepts de cloud | 24 % |
| Domaine 2 : Sécurité et conformité | 30 % |
| Domaine 3 : Technologie et services cloud | 34 % |
| Domaine 4 : Facturation, tarification et support | 12 % |
| **TOTAL** | **100 %** |

---
layout: section
---

# Amazon EC2

Section 3 — Elastic Compute Cloud

---

# Amazon EC2 : présentation

- Service web fournissant une **capacité de calcul sécurisée et redimensionnable** dans le cloud
- Instances, Load Balancers, Auto Scaling, stockage en bloc
- Choix de processeur, stockage, réseau, OS et **modèle d'achat**
- AWS propose instances **Windows, Linux, macOS**
- **Free Tier** : 750h/mois d'instances t2.micro ou t3.micro

---

# Les types d'instance EC2

Convention de nommage : **`m5.2xlarge`**
- `m` = classe d'instances
- `5` = génération
- `2xlarge` = taille

| Famille | Cas d'usage |
|---------|-------------|
| **Usage général** (t, m) | Équilibre CPU/RAM — web, apps, code |
| **Optimisée calcul** (c) | Transcodage, HPC, ML, serveurs jeu |
| **Optimisée mémoire** (r, x) | BI, bases de données haute performance |
| **Optimisée stockage** (i, d) | OLTP, NoSQL, HDFS |
| **Accélérée** (p, g) | Machine learning, GPU |

---

# Les modes de consommation EC2

| Mode | Réduction | Usage recommandé |
|------|-----------|-----------------|
| **On-Demand** | — | Court terme, imprévisible |
| **Instances réservées** | jusqu'à 72% | Applications stables, 1 ou 3 ans |
| **Savings Plans** | jusqu'à 72% | Engagement $$/h sur 1 ou 3 ans |
| **Instances Spot** | jusqu'à 90% | Batch, analyse, traitement image — interruptible |
| **Hôtes dédiés** | variable | Licences BYOL, conformité |
| **Instances dédiées** | variable | Matériel dédié au compte |
| **Réservations de capacité** | — | Garantir capacité AZ spécifique |

---

# EC2 User Data (bootstrap)

- Script exécuté **une seule fois** au premier démarrage
- Automatise les tâches : installation logiciels, mises à jour, téléchargements
- S'exécute avec l'utilisateur **root**

```bash
#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
```

---

# Groupes de sécurité

- **Pare-feu virtuel** attaché à l'instance (niveau instance, pas sous-réseau)
- Contrôle le trafic entrant et sortant
- Règles basées sur les **ports**, **plages IP**, **protocoles**

**Comportement par défaut :**
- Tout le trafic **entrant est bloqué**
- Tout le trafic **sortant est autorisé**

**Ports classiques à connaître :**
- `22` = SSH / SFTP
- `21` = FTP
- `80` = HTTP
- `443` = HTTPS
- `3389` = RDP (Windows)

---

# Connexion aux instances

**SSH classique** — Port 22, fichier clé `.pem`

**EC2 Instance Connect**
- Connexion directement depuis le **navigateur**
- Pas besoin de fichier clé téléchargé
- Clé temporaire générée par AWS
- Le port 22 doit rester ouvert

---

# Autres services de calcul

**Amazon Lightsail**
- Version simplifiée d'EC2 (VPS)
- Créer un site ou une application en quelques clics
- Configuration automatique réseau, accès, sécurité

**AWS Batch**
- Traitement par lots entièrement géré à n'importe quelle échelle
- Jobs = début + fin (pas continus)
- Lance dynamiquement des instances EC2 ou Spot
- Jobs définis comme images Docker, exécutés sur ECS

---

# Résumé Section EC2

- **Instance** = AMI (OS) + taille (CPU/RAM) + stockage + security group + User Data
- **Security Group** = pare-feu attaché à l'instance
- **EC2 User Data** = script au premier démarrage
- **SSH** = terminal dans l'instance (port 22)
- **Rôle IAM** = lien vers les permissions IAM pour l'instance
- **Modèles d'achat** : On-Demand, Réservées, Savings Plans, Spot, Dédiés, Réservation de capacité

---
layout: section
---

# Haute Disponibilité & Scalabilité

Section 4

---

# La haute disponibilité

- Systèmes **hautement disponibles** = continuent à fonctionner même en cas de défaillance de composants critiques
- **Résilience** = gérer les pannes sans interruption de service
- HA = exécuter l'application dans **au moins 2 zones de disponibilité**
- Objectif : survivre à la **perte d'un datacenter**

---

# Elastic Load Balancing (ELB)

**Répartit automatiquement le trafic** sur plusieurs cibles et plusieurs AZ.

ELB = **service managé** :
- AWS garantit son fonctionnement
- Mises à niveau et maintenance gérées par AWS
- **750h gratuites/mois**

**4 types de load balancers :**
| Type | Couche | Usage |
|------|--------|-------|
| Application LB | L7 (HTTP/HTTPS) | Apps web, routage par URL/header |
| Network LB | L4 (TCP) | Ultra-haute performance |
| Gateway LB | L3 | Appliances réseau (IDS/IPS) |
| Classic LB | L4+L7 | Ancien (plus disponible pour nouveaux comptes) |

---

# Scalabilité verticale vs horizontale

<div class="grid grid-cols-2 gap-4 mt-4">

**📈 Verticale (Scale Up/Down)**
- Augmenter la taille de l'instance
- t2.micro → t2.large
- Limite matérielle
- Courant pour les bases de données

**↔️ Horizontale (Scale Out/In)**
- Augmenter le nombre d'instances
- Implique des systèmes distribués
- Courant pour les apps web modernes
- Facile avec EC2

</div>

---

# Évolutivité vs Élasticité vs Agilité

**Évolutivité** : Capacité d'un système à s'adapter à une charge plus importante (vertical ou horizontal).

**Élasticité** : Une fois le système évolutif, l'élasticité = **auto-scalabilité** en fonction de la charge. Cloud-friendly : paiement à l'utilisation.

**Agilité** : Les nouvelles ressources ne sont qu'à un clic — délai de quelques **semaines → quelques minutes**.

---

# AWS Auto Scaling Group (ASG)

- **Évoluer** (ajout d'instances) face à une charge accrue
- **Réduire** (suppression d'instances) lors d'une charge réduite
- Garantir un **minimum/maximum** de machines
- Enregistrer automatiquement les instances auprès du load balancer
- **Remplacer** les instances non opérationnelles
- Déclenchement via métriques CloudWatch (CPU, mémoire, I/O)

**Stratégies de mise à l'échelle :**
- Manuelle, Dynamique (simple/pas à pas), Suivi de cible, Planifiée

---

# Résumé Section HA

- **HA** vs **scalabilité** (verticale / horizontale) vs **élasticité** vs **agilité**
- **ELB** : répartit le trafic sur plusieurs instances EC2, multi-AZ, health checks
  - Application LB (HTTP - L7), Network LB (TCP - L4)
- **ASG** : élasticité multi-AZ, remplace instances défectueuses, intégré à l'ELB

---
layout: section
---

# Supervision

Section 5 — Amazon CloudWatch

---

# Amazon CloudWatch

- **Visibilité** au niveau des ressources et de l'état de l'application
- Vue d'ensemble du système sur une seule console
- **Alarmes** déclenchées sur métriques (seuils)
- Collecte **logs et métriques** de tous les services AWS
- Peut déclencher des actions : SNS, Lambda, Auto Scaling

**Métriques importantes :**
- EC2 : CPU, vérifications d'état, réseau (⚠️ pas la RAM par défaut)
- EBS : lecture/écriture disque
- S3 : BucketSizeBytes, NumberOfObjects
- Coûts AWS : Billing and Cost Management, Cost Explorer, Budgets
- Métriques personnalisées possibles

> Par défaut : métriques toutes les **5 minutes**. Option détaillée : 1 minute ($$$).

---
layout: section
---

# Réseau & Diffusion de contenu

Section 6

---

# Amazon Route 53

- Service AWS de **DNS managé**
- Enregistre et gère des **noms de domaine**
- Traduit un nom de domaine en adresse IP ou endpoint AWS
- **Règles de routage** DNS :
  - Par latence
  - Par géolocalisation
  - Par poids
  - Par état de santé des ressources
- Intègre des **health checks** pour vérifier la disponibilité
- Hautement disponible et scalable

> Route 53 associe les noms de domaine aux ressources AWS et peut router le trafic selon différentes stratégies DNS.

---

# Amazon VPC (Virtual Private Cloud)

- Réseau virtuel **logiquement isolé** dans AWS
- Contrôle total sur l'environnement réseau : placement, connectivité, sécurité
- Étapes :
  1. Créer le VPC
  2. Ajouter des ressources (EC2, RDS, etc.)
  3. Définir comment les VPC communiquent (peering, Transit Gateway)

**Éléments clés :**
- **Sous-réseaux** publics / privés
- **Security Groups** (stateful, niveau instance)
- **NACL** (stateless, niveau sous-réseau)
- **Internet Gateway / NAT Gateway**

---

# AWS CloudFront

- **Réseau de diffusion de contenu (CDN)**
- Met en **cache** le contenu à la périphérie (edge locations)
- Améliore les performances de lecture et l'expérience utilisateur
- Réseau mondial de **Points de Présence (PoP)**
- **Protection DDoS** intégrée (AWS Shield)
- Intégré avec AWS WAF

---
layout: section
---

# Sécurité, Conformité & Gouvernance

Section 7

---

# Modèle de responsabilité partagée

<div class="grid grid-cols-2 gap-4 mt-4">

**AWS est responsable de :**
> Sécurité **DU** cloud

- Infra physique, datacenters
- Hardware, réseau, virtualisation
- Services managés

**Le client est responsable de :**
> Sécurité **DANS** le cloud

- OS invité, patches
- Configuration réseau (VPC, SG)
- Données et chiffrement
- Gestion des identités IAM
- Configuration des applications

</div>

---

# AWS Artifact

- Portail **libre-service** pour les documents de conformité
- Centralise rapports et attestations d'auditeurs tiers
- Documents accessibles : **ISO, SOC, PCI DSS, RGPD**
- Aide les équipes sécurité, conformité et audit

> AWS Artifact **ne sécurise pas** les ressources — il fournit les **preuves et documents** pour démontrer la conformité.

---

# AWS IAM — Identity and Access Management

- Filtre de **contrôle d'accès** dans tous les services AWS
- Contrôle l'accès aux services et ressources, **sous conditions**
- Gestion des autorisations utilisateurs et systèmes (**moindre privilège**)

**Bonnes pratiques IAM :**
- Ne pas utiliser le compte root (sauf configuration initiale)
- 1 utilisateur physique = 1 utilisateur AWS
- Groupes → Permissions (pas d'affectation directe)
- Politique de mot de passe fort
- **MFA** obligatoire
- Utiliser des **rôles** pour les services AWS
- Auditer avec le rapport IAM Credentials
- Ne jamais partager utilisateurs IAM ni clés d'accès

---

# IAM Identity Center

- Centralise les accès des utilisateurs à **plusieurs comptes AWS et applications**
- **SSO (Single Sign-On)** : une seule connexion pour tout
- Se connecte aux providers d'identité existants :
  - Microsoft Entra ID, Okta, Google Workspace, Active Directory
- Attribue des accès par utilisateur ou groupe via **permission sets**
- Réduit la création d'utilisateurs IAM dans chaque compte
- Adapté aux **environnements multi-comptes** avec AWS Organizations

> **IAM Identity Center** centralise les accès humains. **IAM** gère les permissions, rôles et politiques.

---

# Shadow IT & Shadow AI

**Shadow IT** : usage de systèmes, logiciels, services IT **non approuvés** par la DSI.

**Risques :**
- Sécurité : violation ou vol de données
- Coût : solutions plus chères que celles agréées
- Conformité : application aléatoire des processus
- Non-conformité RGPD
- Réputation : risque sur l'image en cas d'incident

**Statistiques 2025 :**
- Les entreprises utilisent en moyenne **1 295 applications cloud** (moins de 2% gérées par l'IT)
- 72% de l'usage GenAI en entreprise relève du Shadow IT
- 38% des employés partagent des données confidentielles avec des IA sans approbation

---

# Services de détection & protection

| Service | Rôle |
|---------|------|
| **Amazon Macie** | Découverte de données sensibles (PII) dans S3 via ML |
| **AWS Cognito** | Identité pour utilisateurs web/mobile (millions d'utilisateurs) |
| **AWS GuardDuty** | Détection intelligente des menaces (CloudTrail, VPC Flow Logs, DNS) |
| **Amazon Inspector** | Gestion des vulnérabilités (EC2, ECR, Lambda) — CWPP |
| **AWS Security Hub** | Vue consolidée des findings de sécurité |
| **AWS Shield** | Protection DDoS (Standard gratuit, Advanced payant) |
| **AWS Network Firewall** | Pare-feu réseau managé VPC (stateless + stateful, IDS/IPS) |
| **AWS WAF** | Pare-feu applicatif web (L7) : SQL injection, XSS, rate limiting |

---

# Chiffrement & Secrets

**AWS KMS (Key Management Service)**
- Gestion des **clés cryptographiques**
- Types de clés :
  - **AWS owned keys** : gérées par AWS
  - **AWS managed keys** : dans le compte client, gérées par AWS
  - **Customer managed keys** : créées et gérées par le client
- Chiffre : EBS, RDS, EFS, S3 (SSE-KMS)

**AWS Secrets Manager vs Parameter Store**

| | Secrets Manager | Parameter Store |
|-|-----------------|-----------------|
| Usage | Secrets sensibles (mots de passe BDD, tokens) | Configuration (URLs, variables d'env) |
| Rotation | Automatique | Non |
| Coût | Payant | Niveau gratuit disponible |

---
layout: section
---

# IA, Machine Learning & Analytique

Section 8

---

# Services IA/ML AWS

| Service | Fonction |
|---------|----------|
| **Rekognition** | Détection visages, objets, célébrités, modération |
| **Transcribe** | Parole → texte (ASR), suppression PII |
| **Polly** | Texte → parole réaliste (TTS) |
| **Translate** | Traduction linguistique naturelle |
| **Lex** | Chatbots conversationnels (technologie Alexa) |
| **Connect** | Centre de contact cloud (intégration CRM) |
| **Comprehend** | NLP : entités, sentiments, classification |
| **SageMaker** | Plateforme ML complète pour dev et data scientists |
| **Forecast** | Prévisions très précises (ML) |
| **Kendra** | Moteur de recherche de documents (ML) |
| **Personalize** | Recommandations personnalisées temps réel |
| **Textract** | Extraction texte et données de documents scannés |

---

# IA Générative

**Amazon Bedrock**
- Accès à plusieurs **modèles de fondation** via une API
- Modèles d'Amazon et de fournisseurs tiers
- Génération de texte, résumé, classification, dialogue
- Bases de connaissances, agents IA
- Service managé, sécurisé, scalable
- Cas d'usage : chatbot, résumé de documents, RAG, automatisation

**Amazon Q**
- Assistant IA générative prêt à l'emploi
- Orienté entreprise, développement et données
- Aide développeurs (générer, tester, moderniser du code)
- Recherche d'information interne, assistance AWS

---

# Services Analytique

| Service | Rôle |
|---------|------|
| **Athena** | Requêtes SQL serverless sur données S3 (CSV, JSON, Parquet…) |
| **QuickSight** | BI serverless — tableaux de bord interactifs ML-powered |
| **Redshift** | Entrepôt de données (OLAP) — jusqu'à plusieurs Po |
| **EMR** | Clusters Hadoop (Spark, HBase, Presto) — Big Data |
| **Kinesis** | Streaming de données en temps réel |
| **Glue** | ETL/ELT serverless — intégration de données, Data Catalog |

---
layout: section
---

# Outils Développeur & CI/CD

Section 9

---

# Pipeline CI/CD AWS

| Service | Rôle |
|---------|------|
| **CodeArtifact** | Référentiel de packages managé (npm, Maven, pip, NuGet…) |
| **CodeBuild** | Build managé — compile, teste, produit des artefacts (buildspec.yml) |
| **CodeDeploy** | Déploiement automatisé sur EC2, Fargate, Lambda, on-premises |
| **CodePipeline** | Orchestration CI/CD — Source → Build → Test → Deploy |
| **X-Ray** | Traçage distribué — suit les requêtes à travers les microservices |

---

# AWS CodePipeline — principe

```
Source          Build           Test            Deploy
────────        ────────        ────────        ────────
GitHub    →   CodeBuild   →   Tests auto   →  CodeDeploy
CodeCommit      buildspec.yml     unitaires       EC2 / Lambda
S3                               intégration     ECS / CloudFormation
```

- Standardise et sécurise les mises en production
- S'intègre avec GitHub, GitLab, Jenkins, GitHub Actions

---

# AWS Amplify & Elastic Beanstalk

**AWS Amplify**
- Développer, déployer et héberger des apps web/mobile (React, Angular, Vue, Next.js)
- Connexion à GitHub, Bitbucket, GitLab — CI/CD automatique
- Gère HTTPS, domaines, CDN, authentification, API, stockage

**AWS Elastic Beanstalk**
- Déployer rapidement une application **sans gérer l'infra**
- AWS provisionne : EC2, Load Balancer, Auto Scaling, CloudWatch
- Compatible : Java, .NET, Node.js, Python, PHP, Ruby, Go, Docker
- Plus simple qu'EC2 manuel, moins flexible qu'une architecture custom

---
layout: section
---

# Bases de données

Section 10

---

# Propriétés ACID

| Propriété | Description |
|-----------|-------------|
| **Atomicité** | Transaction complète ou annulée |
| **Cohérence** | Passage d'un état valide à un autre |
| **Isolation** | Chaque transaction s'exécute seule |
| **Durabilité** | Transaction confirmée = persistée même après panne |

---

# Amazon RDS

- Service managé pour bases de données **relationnelles**
- 6 moteurs supportés : **Amazon Aurora, PostgreSQL, MySQL, MariaDB, Oracle, SQL Server**
- Fonctionnalités managées :
  - Provisionnement automatique, patches OS
  - Sauvegardes continues (Point-in-time Restore)
  - Multi-AZ pour DR (Disaster Recovery)
  - Read Replicas pour les performances de lecture
  - Scaling vertical et horizontal
- ⚠️ **Pas d'accès SSH** aux instances RDS

---

# Amazon Aurora

- Technologie propriétaire AWS (non open source)
- Compatible **PostgreSQL** et **MySQL**
- **5x plus performant** que MySQL sur RDS, **3x** PostgreSQL
- Storage auto-extensible : 10 Go → 64 To
- **20% plus cher** que RDS standard mais plus efficace
- Pas de Free Tier

---

# Bases de données NoSQL

**Types :**
| Modèle | Description | Service AWS |
|--------|-------------|-------------|
| Documents | JSON hiérarchique | DocumentDB (≈ MongoDB) |
| Clé-valeur | Paires clé/valeur simple | DynamoDB |
| Colonnes larges | Clé/valeur imbriquée | — |
| Graphes | Nœuds, arêtes, relations | Neptune |

**Amazon DynamoDB :**
- NoSQL serverless, réplication 3 AZ, haute disponibilité
- Latence en millisecondes, millions de requêtes/seconde
- Intégré à IAM, autoscaling

**Amazon ElastiCache :**
- Cache en mémoire (Valkey, Redis, Memcached)
- Réduit la charge sur les BDD, latence très faible

---

# Résumé bases de données

| Service | Type | Usage |
|---------|------|-------|
| **RDS** | Relationnel (OLTP) | MySQL, PostgreSQL, MariaDB, Oracle, SQL Server |
| **Aurora** | Relationnel optimisé | PostgreSQL/MySQL hautes performances |
| **DynamoDB** | NoSQL clé-valeur | Serverless, millions req/sec |
| **ElastiCache** | Cache mémoire | Redis/Memcached — latence sub-ms |
| **Redshift** | Entrepôt (OLAP) | Analytique, plusieurs Po |
| **DocumentDB** | Documents JSON | Compatible MongoDB |
| **Neptune** | Graphes | Réseaux sociaux, fraude, recommandations |
| **Athena** | Serverless SQL | Requêtes sur S3 |
| **Glue** | ETL serverless | Intégration de données |
| **DMS** | Migration | Homo et hétérogène |

---
layout: section
---

# Serverless & Intégration Applicative

Section 11

---

# Le Serverless

> Le serverless ne signifie pas « sans serveurs » mais que l'infrastructure est **totalement abstraite**. Le Cloud Provider gère tout, le client se concentre sur le **code**.

**Avantages :**
- Coûts réduits (paiement à l'usage exact)
- Scalabilité automatique gérée par le provider
- Code backend simplifié (fonctions unitaires)
- Time-to-market réduit

**Inconvénients :**
- **Vendor lock-in** important
- Coûts parfois difficiles à estimer
- Surface d'attaque augmentée
- **Cold start** pour les fonctions rarement appelées

---

# AWS Lambda

- Calcul d'événements **sans serveur**
- Exécute du code pour presque tout type d'application
- **1 million de requêtes gratuites/mois**
- Event-Driven : invoqué par AWS sur événement
- Jusqu'à **10 Go de RAM** par fonction
- Basé sur **Firecracker** (microVMs sécurisées)

**Langages supportés :** Node.js, Python, Java, .NET/C#, Ruby, Go, runtime personnalisé

**Déclencheurs typiques :** S3, API Gateway, DynamoDB, SQS/SNS, EventBridge, CloudWatch Events

---

# Intégration Applicative

| Service | Rôle | Idée clé |
|---------|------|----------|
| **API Gateway** | Créer, publier, sécuriser des API REST/HTTP/WebSocket | Entrée vers les services backend |
| **Amazon SQS** | File d'attente de messages (découplage) | Stocker en file, traiter plus tard |
| **Amazon SNS** | Notification pub/sub vers plusieurs abonnés | Notifier / diffuser |
| **Amazon EventBridge** | Bus d'événements managé — routage event-driven | Router des événements |
| **AWS Step Functions** | Orchestration de workflows (machines à états) | Orchestrer un workflow |

---

# SQS vs SNS vs EventBridge vs Step Functions

```
SQS             →  File d'attente    →  Traitement asynchrone (1 consommateur)
SNS             →  Pub/Sub           →  Diffusion vers N abonnés
EventBridge     →  Bus d'événements  →  Routage complexe, sources multiples
Step Functions  →  Orchestration     →  Workflow multi-étapes
```

---
layout: section
---

# Stockage

Section 12

---

# Types de stockage

| Type | Description | Service AWS |
|------|-------------|-------------|
| **Bloc** | Blocs séparés avec ID unique, haute performance | EBS |
| **Fichier** | Structure hiérarchique de dossiers/fichiers | EFS, FSx |
| **Objet** | Fichiers plats avec métadonnées, clé unique | S3, S3 Glacier |

---

# Amazon EBS (Elastic Block Store)

- Stockage **par bloc** pour instances EC2
- Monté sur **une seule instance** à la fois
- Lié à **une zone de disponibilité** spécifique
- Free Tier : **30 Go** de stockage SSD gp2/gp3
- **Snapshots** : sauvegardes point-in-time, copiables entre AZ ou régions

**Amazon EFS (Elastic File System)**
- NFS managé monté sur **des centaines d'EC2** simultanément
- Fonctionne en **multi-AZ** (Linux uniquement)
- Stockage **élastique** (croît/rétrécit automatiquement)
- 3x plus cher que gp2, paiement à l'utilisation

---

# Amazon S3

- Stockage d'objets via API/SDK/CLI/Console
- Adapté : data lakes, sauvegardes, sites statiques, archivage

**Concepts clés :**
- **Bucket** : nom unique mondial, lié à une région
- **Objet** : fichier identifié par une clé (max 5 To)
- Durabilité : **99,999999999 %** (11 9s)
- Disponibilité S3 Standard : **99,99 %**

**Fonctionnalités :**
- Hébergement de sites web statiques
- Versionning (protège contre suppressions accidentelles)
- Réplication (CRR = inter-régions, SRR = même région)
- Classes de stockage selon la fréquence d'accès

---

# Classes de stockage S3

| Classe | Latence | Usage |
|--------|---------|-------|
| **S3 Standard** | ms | Données fréquemment accédées |
| **S3 Intelligent-Tiering** | ms | Patterns d'accès variables |
| **S3 Standard-IA** | ms | Accès peu fréquent, critique |
| **S3 One Zone-IA** | ms | Accès peu fréquent, 1 seule AZ |
| **S3 Glacier Instant** | ms | Archive, récupération immédiate |
| **S3 Glacier Flexible** | min/h | Archive, récupération flexible |
| **S3 Glacier Deep Archive** | h | Archive long terme, le moins cher |

---

# AWS Snow Family & Storage Gateway

**AWS Snow Family** — Migration physique de données
- **Snowcone** : 8 TB, petit appareil portable
- **Snowball Edge** : 80 TB, edge computing
- Utile quand le réseau ne suffit pas pour transférer vers S3

**AWS Storage Gateway** — Pont on-premises ↔ cloud
- Types : File Gateway, Volume Gateway, Tape Gateway
- Cas d'usage : backup, DR, stockage hybride

**AWS Backup**
- Sauvegardes centralisées et automatisées
- Multi-services, multi-régions, multi-comptes (via Organizations)

---

# Résumé Stockage

- **EBS** : stockage bloc pour EC2, une AZ, max 5 To par volume
- **EFS** : NFS multi-AZ, monté sur N instances Linux simultanément
- **S3** : stockage objet, universel, durabilité 11 9s
- **Versionning S3** : protège des suppressions accidentelles
- **Réplication S3** : CRR (cross-region) ou SRR (same-region)
- **Classes S3** : Standard, IA, Glacier selon la fréquence d'accès
- **Snow Family** : migration de données volumineuses via appareil physique
- **CloudFront** : CDN — cache à la périphérie, DDoS protection

---
layout: section
---

# Well Architected Framework & IaC

Section 13

---

# Well Architected Framework — 6 piliers

| Pilier | Description |
|--------|-------------|
| **Excellence opérationnelle** | Alerting, monitoring, suivi de charge, amélioration continue |
| **Sécurité** | IAM, chiffrement, security groups, politiques de comptes |
| **Fiabilité** | Redondance, résilience, récupération automatique |
| **Performance** | Dimensionnement au plus proche du besoin, auto-scaling |
| **Optimisation des coûts** | RI, Spot, Serverless, right-sizing |
| **Durabilité** | Réduction de l'impact environnemental |

---

# Infrastructure as Code (IaC)

> Gérer et provisionner l'infrastructure informatique **par le code**, sans processus manuels.

**Avantages :**
- Reproductibilité, cohérence entre environnements
- Versioning de l'infra (Git)
- Déploiement rapide et automatisé
- Réduction des erreurs humaines

---

# AWS CloudFormation

- Outil IaC natif AWS
- Templates **YAML ou JSON** → Stacks de ressources AWS
- Concepts : **Template** (fichier descriptif) + **Stack** (ensemble de ressources géré comme une unité)

**Commandes CLI essentielles :**
```bash
aws cloudformation create-stack --stack-name mystack --template-body file://template.yaml
aws cloudformation list-stacks
aws cloudformation describe-stacks --stack-name mystack
aws cloudformation validate-template --template-body file://template.yaml
aws cloudformation deploy --template-file template.yaml --stack-name mystack
aws cloudformation delete-stack --stack-name mystack
```

---

# Hashicorp Terraform

- Outil IaC **open source** (Go), par HashiCorp
- Langage HCL (Hashicorp Configuration Language) ou JSON
- Fichiers `.tf` + CLI terraform

**Concepts clés :**
- **Providers** : plugins pour interagir avec les API (AWS, GCP, Azure, Heroku…)
- **Resources** : objets d'infrastructure (EC2, VPC, DNS…)
- **Data Sources** : informations en lecture seule depuis le provider

**Commandes essentielles :**
```bash
terraform init       # Initialiser le projet
terraform plan       # Prévisualiser les changements
terraform apply      # Appliquer les changements
terraform destroy    # Détruire l'infrastructure
```

---

# Stratégies de déploiement

**Blue/Green**
- Deux environnements identiques (blue = prod, green = nouvelle version)
- Bascule instantanée, rollback facile

**Canary Release**
- Déploiement progressif vers un petit % des utilisateurs
- Validation avant déploiement complet

**Rolling Upgrade**
- Mise à jour progressive instance par instance
- Zéro downtime, rollback progressif

---
layout: section
---

# Microservices & Conteneurs

Section 14

---

# Architecture Microservices

**Monolithique vs Microservices**

| | Monolithe | Microservices |
|--|-----------|---------------|
| Déploiement | App entière | Service par service |
| Scalabilité | Verticale | Horizontale par service |
| Technologie | Une seule stack | Polyglotte |
| Complexité | Simple au début | Plus complexe, mais plus flexible |
| Résilience | Un bug = tout tombe | Isolation des pannes |

**Avantages microservices :** Déploiements indépendants, scalabilité ciblée, teams autonomes, technology freedom

---

# Conteneurs sur AWS

**Amazon ECR (Elastic Container Registry)**
- Registry Docker **privé** managé par AWS
- Stockage et gestion d'images Docker
- Intégré avec ECS, EKS, Lambda

**Amazon ECS (Elastic Container Service)**
- Orchestration de conteneurs Docker
- Déploiement sur instances EC2 ou en mode Fargate
- Intégré avec ELB, IAM, CloudWatch

**AWS Fargate**
- Serverless pour les conteneurs Docker
- **Pas d'instances EC2** à gérer
- Paiement selon CPU/RAM utilisés
- Idéal pour démarrer rapidement sans gérer le cluster

---
layout: section
---

# Gouvernance & Organisations

Section 15

---

# AWS Trusted Advisor

- Analyse vos comptes AWS et fournit des **recommandations** sur :
  - Optimisation des **coûts**
  - **Performances**
  - **Sécurité**
  - Tolérance aux **pannes**
  - Quotas de service

---

# AWS CloudTrail

- **Gouvernance, conformité et audit** du compte AWS
- Activé **par défaut**
- Historique de tous les événements/appels d'API :
  - Console, SDK, CLI, services AWS
- Logs → CloudWatch Logs ou S3
- Applicable à toutes les régions ou une seule

> ⚠️ Si une ressource est supprimée dans AWS, examiner **d'abord CloudTrail** !

---

# AWS Config

- **Audit et enregistrement de la conformité** des ressources AWS
- Historique des configurations et changements
- Questions auxquelles il répond :
  - Accès SSH illimité dans mes security groups ?
  - Mes buckets S3 ont-ils un accès public ?
  - Comment ma configuration ALB a-t-elle changé ?
- Service par région, agrégeable entre régions et comptes
- Alertes SNS sur tout changement

---

# AWS Organizations

- Gestion **centralisée de plusieurs comptes AWS**
- **Facturation consolidée** : paiement unique
- Remises sur volume agrégé (EC2, S3…)
- API pour automatiser la création de comptes
- **SCP (Service Control Policies)** pour restreindre les privilèges

**Terminologie :**
- **Organisation** : entité racine avec hiérarchie de comptes
- **Root** : conteneur parent de tous les comptes
- **OU (Unité d'organisation)** : groupe de comptes avec politiques héritées
- **Compte AWS** : compte standard contenant ressources et identités

---

# Service Control Policies (SCP)

- Listes blanches/noires d'actions IAM
- Appliquées au niveau **OU ou compte** (pas au compte principal)
- Affecte **tous les utilisateurs et rôles**, y compris root
- Doit avoir une **autorisation explicite** (rien n'est autorisé par défaut)

**Cas d'usage :**
- Interdire l'usage d'un service spécifique
- Appliquer la conformité PCI
- Restreindre les régions autorisées

---

# AWS Control Tower

- Configuration et gestion d'un environnement **multi-comptes sécurisé**
- Automatise la configuration en quelques clics
- Gestion continue des règles via **guardrails** (barrières de sécurité)
- Détecte et remédie aux violations de politique
- Tableau de bord de conformité
- S'exécute **au-dessus d'AWS Organizations**

---
layout: section
---

# Facturation & Gestion des Coûts

Section 16

---

# 4 modèles de tarification AWS

1. **Pay as you go** — Payez ce que vous utilisez
2. **Save when you reserve** — RI pour EC2, DynamoDB, ElastiCache, RDS, Redshift
3. **Pay less using more** — Remises par volume
4. **Pay less as AWS grows** — Les coûts baissent avec les économies d'échelle AWS

---

# Tarification par service (aperçu)

**EC2 :**
- On-Demand : à la seconde, prix variable par type/région
- Reserved : jusqu'à 72% de remise (1 ou 3 ans)
- Spot : jusqu'à 90% de remise

**Lambda :**
- Facturation par nombre de requêtes + durée d'exécution
- 1 million de requêtes/mois gratuites

**S3 :**
- Stockage (par Go), transfert de données, requêtes
- Pas de frais pour l'ingestion de données (PUT depuis Internet)

**RDS :**
- Instance (à l'heure), stockage (par Go/mois), I/O, transfert

---

# Outils de gestion des coûts

| Service | Rôle |
|---------|------|
| **Calculatrice AWS** | Estimer les coûts avant déploiement |
| **AWS Compute Optimizer** | Recommandations de rightsizing (EC2, Lambda, EBS) |
| **Billing Dashboard** | Vue d'ensemble des dépenses en cours |
| **Cost Explorer** | Analyse et visualisation des coûts passés et futurs |
| **AWS Budgets** | Alertes quand les dépenses dépassent un seuil |
| **Cost Anomaly Detection** | Détection automatique des anomalies de coûts |
| **Balises de coûts** | Répartir les coûts par équipe, projet, environnement |
| **AWS Service Quotas** | Suivre et demander l'augmentation des limites de service |

---

# Bonnes pratiques de gestion des coûts

- Utiliser des **balises** pour répartir les coûts par projet/équipe
- Activer les **alertes Budgets** dès la création du compte
- Consulter **Trusted Advisor** pour identifier les ressources inutilisées
- Utiliser **Cost Explorer** pour analyser les tendances
- Activer **Compute Optimizer** pour le rightsizing
- Préférer **Spot** ou **Savings Plans** pour les workloads prévisibles
- Surveiller le **Free Tier** dans le tableau de bord AWS

---
layout: section
---

# Autres Services & Architecture

Section 17

---

# Services supplémentaires notables

| Service | Description |
|---------|-------------|
| **AWS Ground Station** | Réseau d'antennes satellites managé |
| **Amazon WorkSpaces** | Bureau virtuel cloud (VDI) |
| **Amazon AppStream 2.0** | Streaming d'applications de bureau |
| **AWS IoT Core** | Connexion et gestion d'appareils IoT |
| **Amazon Managed Blockchain** | Réseaux blockchain Ethereum / Hyperledger Fabric |
| **AWS Elemental MediaConvert** | Transcodage vidéo en nuage |
| **AWS AppSync** | API GraphQL managée |
| **AWS Device Farm** | Tests sur appareils mobiles réels |

---

# Dimensionnement approprié (right sizing)

- Analyser les **métriques CloudWatch** pour identifier le dimensionnement optimal
- Outils : **AWS Compute Optimizer**, **Cost Explorer**, **Trusted Advisor**
- Réduire le surdimensionnement avant de migrer vers Reserved Instances

---

# Support AWS

| Plan | Public cible |
|------|-------------|
| **Basic** | Accès aux forums, documentation (gratuit) |
| **Developer** | Email support, heures ouvrées |
| **Business** | 24/7 téléphone/chat, accès Trusted Advisor complet |
| **Enterprise On-Ramp** | Orientations proactives |
| **Enterprise** | Gestionnaire de compte technique (TAM) dédié |

---

# Ressources AWS

- **AWS Marketplace** : logiciels tiers certifiés par AWS
- **AWS Training & Certification** : formations officielles
- **AWS IQ** : experts AWS certifiés pour des missions
- **AWS re:Post** : forum communautaire (remplace AWS Forums)
- **AWS Managed Services (AMS)** : opérations d'infrastructure managées

---
layout: section
---

# Préparation à la Certification

Section 18 — AWS Certified Cloud Practitioner (CLF-C02)

---

# Conseils pour l'examen

**Contenu de l'examen :**
- Deux types de questions :
  - **Choix unique** : une bonne réponse parmi 4
  - **Réponse multiple** : 2+ bonnes réponses parmi 5+
- Aucune pénalité pour mauvaise réponse → **toujours répondre**
- Possibilité de **flaguer** une question pour y revenir

**Stratégie :**
- Procéder par **élimination** (supprimer les réponses clairement fausses)
- Pas d'overthinking — si une solution semble très compliquée, elle est probablement fausse
- Lire l'**aperçu** de chaque service sur `aws.amazon.com/fr/<nom-du-service>/`
- **6 mois de pratique** recommandés avant l'examen

---

# Table des sigles

| Sigle | Signification |
|-------|--------------|
| **AZ** | Availability Zone (Zone de disponibilité) |
| **VPC** | Virtual Private Cloud |
| **EC2** | Elastic Compute Cloud |
| **IAM** | Identity and Access Management |
| **S3** | Simple Storage Service |
| **RDS** | Relational Database Service |
| **EBS** | Elastic Block Store |
| **EFS** | Elastic File System |
| **AMI** | Amazon Machine Image |
| **ALB** | Application Load Balancer |
| **HA** | High Availability |
| **IaC** | Infrastructure as Code |
| **SDK** | Software Development Kit |
| **CLI** | Command Line Interface |

---
layout: center
class: text-center
---

# Des questions ?

<div class="text-gray-400 mt-4">AWS Cloud Foundation — IAWS010</div>

---
layout: center
class: text-center
---

# « Nous n'apprenons pas de l'expérience…

## nous apprenons en réfléchissant sur l'expérience. »

— John Dewey

<div class="text-gray-400 mt-8">© 2026, Loïc Rossignol, IAWS010</div>
