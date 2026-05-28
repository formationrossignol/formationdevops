---
theme: default
title: Sécurité AWS
titleTemplate: '%s — Formation AWS'
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
transition: slide-left
mdc: true
---

# Sécurité AWS

De la théorie aux bonnes pratiques

<div class="text-gray-400 mt-4 text-sm">Loïc Rossignol · Formation AWS</div>

---

# Plan du cours

<v-clicks>

1. **Modèle de responsabilité partagée** — qui sécurise quoi ?
2. **IAM** — identités, permissions, politiques
3. **Sécurité réseau** — VPC, Security Groups, NACLs
4. **Détection & audit** — CloudTrail, GuardDuty, Security Hub
5. **Protection des données** — chiffrement, KMS, Secrets Manager
6. **Conformité & gouvernance** — Config, Organizations, SCPs

</v-clicks>

---
layout: section
---

# Modèle de responsabilité partagée

---

# AWS est responsable de...

<div class="grid grid-cols-2 gap-8 mt-6">
<div>

### Sécurité **de** l'infrastructure
- Datacenters physiques
- Réseau global (fibre, routeurs)
- Hyperviseurs
- Hardware des services managés

</div>
<div>

### Exemples
- La sécurité physique de us-east-1
- L'isolation entre comptes AWS
- Les patchs de l'hyperviseur EC2
- Le réseau interne de RDS

</div>
</div>

---

# Tu es responsable de...

<div class="grid grid-cols-2 gap-8 mt-6">
<div>

### Sécurité **dans** l'infrastructure
- Système d'exploitation (EC2)
- Configuration réseau (VPC, SG)
- Données (chiffrement, accès)
- Identités et permissions (IAM)
- Code applicatif

</div>
<div>

### Exemples
- Patcher le kernel de tes instances EC2
- Configurer les Security Groups correctement
- Chiffrer les données S3 sensibles
- Auditer les politiques IAM
- Scanner les images Docker

</div>
</div>

---

# Matrice de responsabilité

| Service | AWS | Toi |
|---------|-----|-----|
| **EC2** | Hyperviseur, hardware | OS, appli, réseau, IAM |
| **RDS** | OS, moteur DB, patchs | Données, accès, réseau |
| **Lambda** | Runtime, infra | Code, IAM, données |
| **S3** | Durabilité, stockage | Permissions, chiffrement |
| **EKS** | Control plane | Nœuds, pods, RBAC |

<div class="mt-6 text-sm text-gray-400">
Plus le service est managé → plus AWS prend en charge. Mais la responsabilité ne disparaît jamais côté client.
</div>

---
layout: section
---

# IAM — Identity and Access Management

---

# Les 4 entités IAM

<v-clicks>

- **Root account** — tous les droits, ne jamais utiliser au quotidien, MFA obligatoire
- **Utilisateurs IAM** — identité longue durée pour humains ou apps (à éviter pour les apps)
- **Rôles IAM** — identité temporaire pour services AWS, EC2, Lambda, ECS…
- **Groupes** — collection d'utilisateurs partageant des politiques

</v-clicks>

<div v-click class="mt-8 p-4 border border-amber-500 rounded bg-amber-50 dark:bg-amber-900/20 text-sm">
💡 <strong>Règle d'or :</strong> une application AWS doit utiliser un <strong>rôle IAM</strong>, jamais des clés d'accès statiques.
</div>

---

# Anatomie d'une politique IAM

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::mon-bucket/*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "eu-west-3"
        }
      }
    }
  ]
}
```

---

# Principle of Least Privilege

<div class="grid grid-cols-3 gap-6 mt-8 text-center">

<div class="p-4 border border-red-400 rounded">
<div class="text-2xl mb-2">❌</div>
<div class="font-bold text-sm mb-2">À éviter</div>
<code class="text-xs">"Action": "*"<br/>"Resource": "*"</code>
</div>

<div class="p-4 border border-yellow-400 rounded">
<div class="text-2xl mb-2">⚠️</div>
<div class="font-bold text-sm mb-2">Acceptable</div>
<code class="text-xs">"Action": "s3:*"<br/>"Resource": "arn:...bucket/*"</code>
</div>

<div class="p-4 border border-green-400 rounded">
<div class="text-2xl mb-2">✅</div>
<div class="font-bold text-sm mb-2">Recommandé</div>
<code class="text-xs">"Action": ["s3:GetObject"]<br/>"Resource": "arn:...bucket/prefix/*"</code>
</div>

</div>

---
layout: section
---

# Sécurité réseau

---

# VPC — Les couches de défense

```
Internet Gateway
      │
  [Route Table]
      │
  Security Group  ← Stateful, niveau instance
      │
      EC2
      │
  NACL            ← Stateless, niveau sous-réseau
      │
  [Subnet]
```

<div class="mt-4 text-sm text-gray-400">
Les Security Groups filtrent en entrée ET en sortie. Les NACLs évaluent les règles dans l'ordre (numérotation).
</div>

---

# Security Groups vs NACLs

| | Security Group | NACL |
|--|--|--|
| **Niveau** | Instance | Sous-réseau |
| **État** | Stateful | Stateless |
| **Règles** | Allow uniquement | Allow + Deny |
| **Évaluation** | Toutes les règles | Dans l'ordre (numéro) |
| **Défaut** | Tout refusé | Tout autorisé |

---
layout: section
---

# Détection & Audit

---

# La triade de visibilité AWS

<div class="grid grid-cols-3 gap-6 mt-8">

<div class="p-4 border rounded text-center">
<div class="text-3xl mb-3">📋</div>
<h3 class="font-bold mb-2">CloudTrail</h3>
<p class="text-sm text-gray-500">Qui a fait quoi, quand, depuis où. Toutes les API calls.</p>
</div>

<div class="p-4 border rounded text-center">
<div class="text-3xl mb-3">🛡️</div>
<h3 class="font-bold mb-2">GuardDuty</h3>
<p class="text-sm text-gray-500">Détection d'anomalies et de menaces par ML. Toujours activer.</p>
</div>

<div class="p-4 border rounded text-center">
<div class="text-3xl mb-3">🔍</div>
<h3 class="font-bold mb-2">Security Hub</h3>
<p class="text-sm text-gray-500">Agrégateur de findings. Vue unifiée de ta posture sécurité.</p>
</div>

</div>

---

# CloudTrail — Ce qu'il capture

<v-clicks>

- **Management events** — créer/modifier/supprimer des ressources (activé par défaut)
- **Data events** — opérations sur S3, Lambda, DynamoDB (payant, désactivé par défaut)
- **Insights** — détection d'activité inhabituelle sur les API calls

</v-clicks>

<div v-click class="mt-6 p-4 border border-blue-400 rounded text-sm">
⚠️ CloudTrail seul n'alerte pas. Il faut le combiner avec <strong>CloudWatch Alarms</strong> ou un SIEM pour des notifications temps réel.
</div>

---
layout: section
---

# Protection des données

---

# KMS — Key Management Service

<div class="grid grid-cols-2 gap-8 mt-6">
<div>

### Types de clés
- **AWS managed keys** — gérées par AWS, gratuites, rotation auto
- **Customer managed keys (CMK)** — contrôle total, audit via CloudTrail
- **Data keys** — générées par KMS, utilisées localement (envelope encryption)

</div>
<div>

### Intégration native
- S3, EBS, RDS, EFS
- Secrets Manager, SSM Parameter Store
- CloudWatch Logs, SQS, SNS

</div>
</div>

---

# Secrets Manager vs SSM Parameter Store

| | Secrets Manager | Parameter Store |
|--|--|--|
| **Coût** | ~0.40$/secret/mois | Gratuit (Standard) |
| **Rotation** | Automatique (Lambda) | Manuelle |
| **Chiffrement** | KMS par défaut | KMS optionnel |
| **Versionning** | Oui | Oui |
| **Usage** | DB passwords, API keys | Config, feature flags |

---
layout: section
---

# Conformité & Gouvernance

---

# AWS Config — Règles permanentes

AWS Config surveille en continu l'état de tes ressources :

<v-clicks>

- **Règles managées** — +200 règles AWS prêtes à l'emploi
  - `s3-bucket-public-read-prohibited`
  - `ec2-security-group-attached-to-eni`
  - `iam-root-access-key-check`

- **Règles custom** — Lambda pour logique métier spécifique

- **Conformance Packs** — bundles de règles (CIS, PCI-DSS, HIPAA)

</v-clicks>

---

# Résumé — Les 10 règles d'or

<div class="text-sm">
<v-clicks>

1. Activer **MFA** sur le compte root et tous les utilisateurs IAM
2. Ne jamais utiliser le **compte root** au quotidien
3. Appliquer le **principe du moindre privilège** partout
4. Utiliser des **rôles IAM** pour les applications, jamais de clés statiques
5. Activer **CloudTrail** dans toutes les régions
6. Activer **GuardDuty** — c'est pas cher et ça détecte beaucoup
7. Chiffrer toutes les données au repos avec **KMS**
8. Auditer les **Security Groups** régulièrement — fermer ce qui n'est pas nécessaire
9. Utiliser **Secrets Manager** pour les secrets applicatifs
10. Activer **AWS Config** avec les règles CIS AWS Foundations Benchmark

</v-clicks>
</div>

---
layout: end
---

# Merci

Des questions ?

<div class="mt-8 text-sm text-gray-400">
Prochaine étape → Travaux pratiques IAM, PMapper, Prowler...
</div>
