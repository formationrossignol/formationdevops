---
title: "TP : Automatiser EC2 avec User Data"
date: 2026-05-28
description: Lancer une instance EC2 qui se configure automatiquement au démarrage grâce à un script User Data pour déployer Apache et PHP sans intervention manuelle.
---

## Objectif

Lancer une instance EC2 qui se configure automatiquement au démarrage grâce à un script User Data. À la fin du TP, vous aurez un serveur web Apache opérationnel sans aucune intervention manuelle après le lancement.

## Compétences travaillées

- Scripts d'initialisation (User Data)
- Installation automatique de packages
- Configuration système Linux
- Security Groups
- Déploiement automatisé

## Architecture cible

```
Internet
    |
    | HTTP (port 80)
    v
EC2 t2.micro (Amazon Linux 2023)
    |
    | User Data exécuté au boot
    v
Apache + PHP installés automatiquement
Page web de démonstration
```

## Durée estimée

45 minutes

## Coût

100% Free Tier compatible

- EC2 t2.micro : 750 heures/mois gratuit

---

## Étape 1 : Préparer le script User Data

```bash
#!/bin/bash

# Mise à jour du système
dnf update -y

# Installation Apache et PHP
dnf install -y httpd php

# Démarrage automatique d'Apache
systemctl start httpd
systemctl enable httpd

# Création de la page web de démonstration
cat > /var/www/html/index.php << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>TP AWS EC2 User Data</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { background: white; border-radius: 20px; padding: 40px; max-width: 800px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        h1 { color: #667eea; text-align: center; }
        .status { background: #d4edda; border: 2px solid #28a745; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px; }
        .info-card { background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; }
        .info-card h3 { color: #667eea; margin-bottom: 10px; }
        .badge { display: inline-block; background: #667eea; color: white; padding: 5px 15px; border-radius: 20px; font-size: 0.9em; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>TP AWS EC2 User Data</h1>
        <div class="status"><h2>Serveur déployé avec succès</h2><p>Le script User Data s'est exécuté correctement au démarrage.</p></div>
        <div class="info-grid">
            <div class="info-card"><h3>Système</h3><p><?php echo php_uname('s') . ' ' . php_uname('r'); ?></p><span class="badge"><?php echo php_uname('m'); ?></span></div>
            <div class="info-card"><h3>Serveur Web</h3><p><?php echo apache_get_version(); ?></p><span class="badge">Apache</span></div>
            <div class="info-card"><h3>PHP</h3><p>PHP <?php echo phpversion(); ?></p><span class="badge">Actif</span></div>
            <div class="info-card"><h3>Date serveur</h3><p><?php echo date('d/m/Y H:i:s'); ?></p><span class="badge">UTC</span></div>
            <div class="info-card"><h3>IP serveur</h3><p><?php echo $_SERVER['SERVER_ADDR']; ?></p><span class="badge">Privée</span></div>
            <div class="info-card"><h3>Votre IP</h3><p><?php echo $_SERVER['REMOTE_ADDR']; ?></p><span class="badge">Publique</span></div>
        </div>
    </div>
</body>
</html>
EOF

# Permissions correctes
chown -R apache:apache /var/www/html/
chmod -R 755 /var/www/html/

# Log de confirmation
echo "User Data exécuté avec succès le $(date)" > /var/log/userdata-success.log
```

**Ce que fait ce script :**
1. Met à jour tous les packages système
2. Installe Apache (`httpd`) et PHP
3. Configure Apache pour démarrer automatiquement
4. Crée une page PHP dynamique affichant les infos système
5. Définit les permissions correctes
6. Crée un log de confirmation

---

## Étape 2 : Lancer l'instance EC2

### 2.1 Configuration de base

1. AWS Console → EC2 → **Launch instance**

| Paramètre | Valeur |
|-----------|--------|
| Nom | TP-UserData-WebServer |
| AMI | Amazon Linux 2023 (Free tier eligible) |
| Type | t2.micro |

### 2.2 Security Group

Créez `tp-userdata-sg` avec ces règles :

| Type | Port | Source |
|------|------|--------|
| SSH | 22 | My IP |
| HTTP | 80 | 0.0.0.0/0 |

### 2.3 Ajouter le User Data

1. Développez **Advanced details** (tout en bas)
2. Trouvez le champ **User data**
3. Collez le script de l'étape 1

> IMPORTANT : Vérifiez que la première ligne est `#!/bin/bash` et qu'il n'y a pas d'espaces avant.

### 2.4 Lancer

1. Vérifiez le résumé dans le panneau de droite
2. Cliquez sur **Launch instance**

---

## Étape 3 : Attendre le démarrage

Attendez que l'instance affiche :

```
Instance state: Running
Status checks: 2/2 checks passed
```

Le User Data s'exécute après que l'instance soit `Running` — attendez 1-2 minutes supplémentaires pour qu'Apache soit complètement installé.

---

## Étape 4 : Tester le serveur web

1. Sélectionnez l'instance → copiez **Public IPv4 address**
2. Ouvrez dans votre navigateur :

```
http://VOTRE_IP_PUBLIQUE
```

> Utilisez `http://` et NON `https://`

Vous devriez voir la page de démonstration avec les informations système.

---

## Étape 5 : Vérifier l'exécution du User Data

### Connexion SSH (optionnel)

```bash
ssh -i votre-key.pem ec2-user@VOTRE_IP_PUBLIQUE
```

### Vérifier les services

```bash
sudo systemctl status httpd
php -v
cat /var/log/userdata-success.log
```

### Consulter les logs complets

```bash
sudo cat /var/log/cloud-init-output.log
```

---

## Dépannage

| Problème | Cause probable | Solution |
|----------|---------------|----------|
| Site inaccessible | Instance pas encore prête | Attendez 2-3 minutes de plus |
| Erreur 403 | Security Group mal configuré | Vérifiez port 80 ouvert pour 0.0.0.0/0 |
| Page blanche | User Data pas encore terminé | Consultez `/var/log/cloud-init-output.log` |
| Connexion refusée | Mauvaise URL | Utilisez `http://` et non `https://` |

---

## BONUS : Installer WordPress automatiquement

```bash
#!/bin/bash

dnf update -y
dnf install -y httpd php php-mysqlnd mariadb105-server

systemctl start httpd mariadb
systemctl enable httpd mariadb

mysql -e "CREATE DATABASE wordpress;"
mysql -e "CREATE USER 'wpuser'@'localhost' IDENTIFIED BY 'MotDePasseSecurise123!';"
mysql -e "GRANT ALL PRIVILEGES ON wordpress.* TO 'wpuser'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

cd /tmp
wget https://wordpress.org/latest.tar.gz
tar -xzf latest.tar.gz
cp -r wordpress/* /var/www/html/

cd /var/www/html
cp wp-config-sample.php wp-config.php
sed -i 's/database_name_here/wordpress/' wp-config.php
sed -i 's/username_here/wpuser/' wp-config.php
sed -i 's/password_here/MotDePasseSecurise123!/' wp-config.php

chown -R apache:apache /var/www/html/
chmod -R 755 /var/www/html/
rm -f /var/www/html/index.html
```

Accédez ensuite à `http://VOTRE_IP_PUBLIQUE/wp-admin/install.php`

---

## Nettoyage

1. EC2 → Instances → Instance state → **Terminate instance**
2. EC2 → Security Groups → Supprimez `tp-userdata-sg`
3. EC2 → Key Pairs → Supprimez la clé si créée pour ce TP

---

## Points clés

1. User Data s'exécute **une seule fois** au premier démarrage
2. Les scripts User Data s'exécutent avec les privilèges root
3. Toujours commencer par `#!/bin/bash`
4. Les logs sont dans `/var/log/cloud-init-output.log`
5. User Data peut contenir jusqu'à 16 KB de données
6. Utilisable pour n'importe quel type d'initialisation (packages, config, deploy apps)
