---
title: "TP : RDS MySQL Free Tier"
description: Déployer une base de données MySQL managée avec Amazon RDS, la sécuriser avec Security Groups et effectuer des opérations CRUD.
---

# TP AWS Free Tier : Déployer une base de données MySQL avec RDS

## Objectif

Créer une instance de base de données MySQL managée avec Amazon RDS, la sécuriser correctement avec Security Groups, s'y connecter depuis une instance EC2, et effectuer des opérations CRUD basiques.

## Compétences travaillées

- Création et configuration d'instances RDS
- Configuration de Security Groups pour bases de données
- Connexion à MySQL depuis EC2
- Gestion de bases de données relationnelles
- Bonnes pratiques de sécurité AWS
- Requêtes SQL basiques

## Architecture cible

```
Internet
    |
    | SSH
    v
EC2 t2.micro (client MySQL)
    |
    | MySQL port 3306 (privé)
    v
RDS MySQL db.t3.micro
    |
    +-- Base de données : entreprise
    +-- Tables : employes, departements
```

## Durée estimée

45 minutes

## Coût

100% Free Tier compatible

- RDS MySQL db.t3.micro : 750 heures par mois gratuit
- Stockage : 20 GB inclus
- EC2 t2.micro : 750 heures par mois gratuit

---

## Étape 1 : Créer une instance EC2 (client)

### 1.1 Lancer une instance EC2

1. AWS Console puis EC2
2. Cliquez sur Launch instance

### 1.2 Configuration de base

| Paramètre | Valeur |
|-----------|--------|
| Nom de l'instance | RDS-MySQL-Client |
| Image AMI | Amazon Linux 2023 AMI |
| Type d'instance | t2.micro |

### 1.3 Configuration réseau

**Security Group :**

1. Create security group
2. Nom : `rds-client-sg`
3. Règle : SSH port 22 depuis votre IP

### 1.4 Lancer l'instance

Attendez l'état **Running** puis notez l'ID du Security Group EC2 — nécessaire pour configurer RDS.

---

## Étape 2 : Créer l'instance RDS MySQL

### 2.1 Accéder au service RDS

1. AWS Console → RDS → Databases
2. Create database

### 2.2 Configuration

| Paramètre | Valeur |
|-----------|--------|
| Database creation method | Standard create |
| Engine | MySQL 8.0 |
| Template | **Free tier** |
| DB instance identifier | tp-mysql-database |
| Master username | admin |
| Master password | MotDePasse123!Secure |

### 2.3 Instance configuration

| Paramètre | Valeur |
|-----------|--------|
| DB instance class | db.t3.micro |

### 2.4 Storage

| Paramètre | Valeur |
|-----------|--------|
| Storage type | General Purpose SSD (gp3) |
| Allocated storage | 20 GiB |
| Storage autoscaling | **DÉCOCHEZ** |

> Désactiver l'autoscaling pour éviter de dépasser 20 GB et générer des frais.

### 2.5 Connectivity

| Paramètre | Valeur |
|-----------|--------|
| VPC | Default VPC |
| Public access | **NO** |
| VPC security group | Create new : `rds-mysql-sg` |

> Ne jamais exposer une base de données directement sur Internet.

### 2.6 Additional configuration

| Paramètre | Valeur |
|-----------|--------|
| Initial database name | entreprise |
| Enable automated backups | COCHEZ |
| Backup retention period | 7 days |
| Enable Enhanced monitoring | **DÉCOCHEZ** |
| Deletion protection | **DÉCOCHEZ** |

### 2.7 Créer

Cliquez sur **Create database**. Attendez 5 à 10 minutes que le statut passe à **Available**.

---

## Étape 3 : Configurer les Security Groups

### 3.1 Modifier le Security Group RDS

1. EC2 → Security Groups → `rds-mysql-sg`
2. Inbound rules → Edit inbound rules → Add rule

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| MySQL/Aurora | TCP | 3306 | Security Group ID de votre EC2 |

3. Save rules

> JAMAIS de règle MySQL avec source 0.0.0.0/0.

---

## Étape 4 : Récupérer l'endpoint RDS

1. RDS → Databases → tp-mysql-database
2. Onglet **Connectivity & security**
3. Copier l'**Endpoint**

Exemple : `tp-mysql-database.c9abc1d2efgh.eu-west-3.rds.amazonaws.com`

---

## Étape 5 : Se connecter à EC2 et installer le client MySQL

```bash
ssh -i rds-tp-key.pem ec2-user@IP_PUBLIQUE_EC2
```

```bash
sudo dnf update -y
sudo dnf install mariadb105 -y
mysql --version
```

---

## Étape 6 : Se connecter à RDS MySQL

```bash
mysql -h tp-mysql-database.c9abc1d2efgh.eu-west-3.rds.amazonaws.com -P 3306 -u admin -p
```

Résultat attendu :

```
MySQL [(none)]>
```

---

## Étape 7 : Créer la structure de base de données

```sql
SHOW DATABASES;
USE entreprise;
```

### Créer la table departements

```sql
CREATE TABLE departements (
    id_departement INT PRIMARY KEY AUTO_INCREMENT,
    nom_departement VARCHAR(100) NOT NULL,
    localisation VARCHAR(100),
    budget DECIMAL(12, 2),
    date_creation DATE
);
```

### Créer la table employes

```sql
CREATE TABLE employes (
    id_employe INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    date_embauche DATE NOT NULL,
    poste VARCHAR(100),
    salaire DECIMAL(10, 2),
    id_departement INT,
    FOREIGN KEY (id_departement) REFERENCES departements(id_departement)
);
```

---

## Étape 8 : Insérer des données

```sql
INSERT INTO departements (nom_departement, localisation, budget, date_creation) VALUES
('Informatique', 'Paris', 500000.00, '2020-01-15'),
('Ressources Humaines', 'Lyon', 250000.00, '2020-02-01'),
('Marketing', 'Marseille', 300000.00, '2020-03-10'),
('Finance', 'Paris', 450000.00, '2020-01-20'),
('Recherche et Développement', 'Toulouse', 600000.00, '2020-04-05');
```

```sql
INSERT INTO employes (nom, prenom, email, telephone, date_embauche, poste, salaire, id_departement) VALUES
('Dupont', 'Jean', 'jean.dupont@entreprise.com', '0601020304', '2021-03-15', 'Développeur Senior', 55000.00, 1),
('Martin', 'Sophie', 'sophie.martin@entreprise.com', '0602030405', '2021-06-01', 'Responsable RH', 48000.00, 2),
('Bernard', 'Luc', 'luc.bernard@entreprise.com', '0603040506', '2021-09-10', 'Chef de projet Marketing', 52000.00, 3),
('Dubois', 'Marie', 'marie.dubois@entreprise.com', '0604050607', '2022-01-20', 'Analyste Financier', 46000.00, 4),
('Thomas', 'Pierre', 'pierre.thomas@entreprise.com', '0605060708', '2022-04-05', 'Ingénieur R&D', 58000.00, 5);
```

---

## Étape 9 : Requêtes SQL pratiques

### Jointure employés/départements

```sql
SELECT
    e.nom,
    e.prenom,
    e.poste,
    e.salaire,
    d.nom_departement
FROM employes e
INNER JOIN departements d ON e.id_departement = d.id_departement
ORDER BY e.nom;
```

### Salaire moyen par département

```sql
SELECT
    d.nom_departement,
    COUNT(e.id_employe) AS nombre_employes,
    AVG(e.salaire) AS salaire_moyen,
    MIN(e.salaire) AS salaire_min,
    MAX(e.salaire) AS salaire_max
FROM departements d
LEFT JOIN employes e ON d.id_departement = e.id_departement
GROUP BY d.nom_departement
ORDER BY salaire_moyen DESC;
```

### Employés embauchés en 2023

```sql
SELECT nom, prenom, poste, date_embauche
FROM employes
WHERE YEAR(date_embauche) = 2023
ORDER BY date_embauche;
```

### Mettre à jour un salaire

```sql
UPDATE employes
SET salaire = 60000.00
WHERE email = 'jean.dupont@entreprise.com';
```

---

## Étape 10 : Exporter les données

```bash
mysqldump -h ENDPOINT_RDS -P 3306 -u admin -p entreprise > backup_entreprise.sql
```

---

## Nettoyage

1. RDS → Databases → tp-mysql-database → **Delete** (sans snapshot final)
2. EC2 → Terminer l'instance RDS-MySQL-Client
3. EC2 → Security Groups → Supprimer `rds-mysql-sg` et `rds-client-sg`

---

## Comparaison : RDS vs EC2 + MySQL

| Critère | RDS MySQL | EC2 + MySQL manuel |
|---------|-----------|-------------------|
| Installation | Automatique | Manuelle |
| Backups | Automatiques | À configurer |
| Patches | Automatiques | Manuels |
| Haute dispo | Multi-AZ en 1 clic | Configuration complexe |
| Coût | Légèrement plus cher | Moins cher |

## Points clés

1. RDS est un service managé : AWS gère l'infrastructure
2. `db.t3.micro` est la seule classe éligible au Free Tier
3. Ne JAMAIS exposer RDS sur Internet (Public access: No)
4. Toujours utiliser un Security Group restrictif
5. Storage autoscaling peut dépasser 20 GB → désactiver
6. Enhanced monitoring génère des coûts supplémentaires
7. Connexion : `mysql -h ENDPOINT -P 3306 -u admin -p`
