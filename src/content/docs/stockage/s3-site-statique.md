---
title: "TP : Site web statique sur S3"
description: Héberger un site web statique sur Amazon S3 avec Static Website Hosting, bucket policies et accès public HTTP.
---

## Objectif

Déployer un site web statique complet sur Amazon S3 en utilisant Static Website Hosting, le rendre accessible via HTTP, et configurer les permissions d'accès public.

## Compétences travaillées

- Création et configuration de buckets S3
- Static Website Hosting
- Bucket policies et permissions publiques
- Upload de fichiers sur S3
- Gestion des objets S3

## Architecture cible

```
Navigateur
    |
    | HTTP (URL S3 statique)
    v
S3 Bucket (Static Website Hosting activé)
    |
    +-- index.html
    +-- error.html
    +-- css/style.css
    +-- js/app.js
    +-- images/
```

## Durée estimée

30 minutes

## Coût

100% Free Tier compatible

- S3 : 5 GB de stockage
- 20 000 GET requests/mois
- 2 000 PUT requests/mois

---

## Étape 1 : Créer les fichiers du site

### index.html

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mon site AWS S3</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <nav>
            <div class="logo">MonSite</div>
            <ul>
                <li><a href="#">Accueil</a></li>
                <li><a href="#">À propos</a></li>
                <li><a href="#">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="hero">
            <h1>Site hébergé sur Amazon S3</h1>
            <p>Un site web statique rapide, scalable et économique.</p>
            <a href="#" class="btn">En savoir plus</a>
        </section>

        <section class="features">
            <div class="feature-card">
                <h3>Scalable</h3>
                <p>S3 gère automatiquement n'importe quel niveau de trafic.</p>
            </div>
            <div class="feature-card">
                <h3>Économique</h3>
                <p>Payez uniquement le stockage et les requêtes utilisées.</p>
            </div>
            <div class="feature-card">
                <h3>Fiable</h3>
                <p>Disponibilité de 99,99% avec réplication automatique.</p>
            </div>
        </section>
    </main>

    <footer>
        <p>Déployé avec Amazon S3 - Formation AWS</p>
    </footer>

    <script src="js/app.js"></script>
</body>
</html>
```

### error.html

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Page non trouvée</title>
    <style>
        body { font-family: sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
        h1 { color: #dc3545; }
        a { color: #667eea; }
    </style>
</head>
<body>
    <h1>404 - Page non trouvée</h1>
    <p>La page que vous cherchez n'existe pas.</p>
    <a href="/">Retour à l'accueil</a>
</body>
</html>
```

### css/style.css

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body { font-family: 'Segoe UI', sans-serif; color: #333; }

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
}

nav ul { list-style: none; display: flex; gap: 2rem; }
nav a { color: white; text-decoration: none; }
nav a:hover { text-decoration: underline; }

.hero {
    text-align: center;
    padding: 80px 20px;
    background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
}

.hero h1 { font-size: 2.5rem; margin-bottom: 1rem; color: #667eea; }
.hero p { font-size: 1.2rem; margin-bottom: 2rem; color: #666; }

.btn {
    display: inline-block;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 12px 30px;
    border-radius: 25px;
    text-decoration: none;
    transition: transform 0.2s;
}
.btn:hover { transform: translateY(-2px); }

.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    padding: 60px 40px;
    background: white;
}

.feature-card {
    padding: 30px;
    border-radius: 10px;
    background: #f8f9fa;
    border-left: 4px solid #667eea;
    text-align: center;
}

.feature-card h3 { color: #667eea; margin-bottom: 1rem; }

footer {
    text-align: center;
    padding: 20px;
    background: #333;
    color: white;
}
```

### js/app.js

```javascript
document.addEventListener('DOMContentLoaded', () => {
    console.log('Site chargé depuis Amazon S3');
    
    // Animation d'apparition des cards
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `all 0.5s ease ${i * 0.1}s`;
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    });
});
```

---

## Étape 2 : Créer le bucket S3

1. AWS Console → S3 → **Create bucket**

| Paramètre | Valeur |
|-----------|--------|
| Bucket name | mon-site-statique-123456789012 |
| Region | eu-west-3 |
| Block Public Access | **Décochez tout** |

> Cochez : "I acknowledge that the current settings might result in this bucket and the objects within becoming public."

2. Create bucket

---

## Étape 3 : Uploader les fichiers

1. Cliquez sur le bucket créé
2. **Upload** → Add files / Add folder

Structure à uploader :

```
index.html
error.html
css/style.css
js/app.js
```

> Maintenez la structure de dossiers lors de l'upload.

3. Upload

---

## Étape 4 : Activer Static Website Hosting

1. Onglet **Properties**
2. Section **Static website hosting** → **Edit**

| Paramètre | Valeur |
|-----------|--------|
| Static website hosting | Enable |
| Hosting type | Host a static website |
| Index document | index.html |
| Error document | error.html |

3. Save changes

Notez l'**URL du site web** affichée en bas :

```
http://mon-site-statique-123456789012.s3-website.eu-west-3.amazonaws.com
```

---

## Étape 5 : Configurer la bucket policy

1. Onglet **Permissions**
2. Section **Bucket policy** → **Edit**

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::mon-site-statique-123456789012/*"
        }
    ]
}
```

> Remplacez `mon-site-statique-123456789012` par le nom exact de votre bucket.

3. Save changes

---

## Étape 6 : Tester le site

Ouvrez l'URL S3 dans votre navigateur :

```
http://mon-site-statique-123456789012.s3-website.eu-west-3.amazonaws.com
```

Vous devriez voir votre page d'accueil. Testez aussi une URL inexistante pour voir la page d'erreur.

---

## Dépannage

| Problème | Cause | Solution |
|----------|-------|----------|
| 403 Forbidden | Bucket policy manquante ou Block Public Access actif | Vérifiez les permissions et décochez Block Public Access |
| 404 Not Found | Static hosting désactivé ou index.html manquant | Activez Static Website Hosting et uploadez index.html |
| CSS/JS non chargé | Chemins de fichiers incorrects | Vérifiez les chemins relatifs dans le HTML |

---

## BONUS : Aller plus loin

### HTTPS avec CloudFront

Pour ajouter HTTPS et améliorer les performances :

1. CloudFront → **Create distribution**

| Paramètre | Valeur |
|-----------|--------|
| Origin domain | mon-site-statique-123456789012.s3-website.eu-west-3.amazonaws.com |
| Viewer protocol | Redirect HTTP to HTTPS |
| Price class | Use only North America and Europe |

2. Create distribution

URL CloudFront : `https://d1234abcd5678.cloudfront.net`

### Domaine personnalisé

1. Achetez un domaine dans Route 53 (ou utilisez un domaine existant)
2. Créez un enregistrement CNAME ou A alias vers CloudFront
3. Configurez un certificat SSL via AWS Certificate Manager (gratuit)

### CI/CD avec GitHub Actions

```yaml
name: Deploy to S3

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: eu-west-3
    
    - name: Deploy to S3
      run: |
        aws s3 sync . s3://mon-site-statique-123456789012 \
          --exclude ".git/*" \
          --delete
    
    - name: Invalidate CloudFront
      run: |
        aws cloudfront create-invalidation \
          --distribution-id E1234567890ABC \
          --paths "/*"
```

### Versioning pour backup

1. Properties → **Bucket Versioning** → Enable

Permet de récupérer des versions antérieures des fichiers en cas d'écrasement accidentel.

---

## Nettoyage

1. S3 → sélectionnez le bucket → **Empty** (vider le contenu)
2. Confirmez la suppression du contenu
3. **Delete** le bucket
4. Confirmez

---

## Comparaison : S3 vs autres hébergements

| Critère | S3 Statique | CloudFront + S3 | EC2 |
|---------|-------------|-----------------|-----|
| Coût | Très faible | Faible | Variable |
| HTTPS | Non natif | Oui | Oui |
| CDN | Non | Oui | Non |
| Backend | Non | Non | Oui |
| Cas d'usage | Landing pages, docs | Sites publics | Applications |

**S3 statique est idéal pour :**
- Pages de présentation
- Documentation
- Blogs générés statiquement (Hugo, Jekyll, VitePress)
- Pages de maintenance
- Prototypes

---

## Points clés

1. S3 Static Website Hosting sert des fichiers HTML/CSS/JS via HTTP
2. Block Public Access doit être désactivé pour les sites publics
3. La bucket policy `s3:GetObject` pour `Principal: "*"` rend les fichiers accessibles
4. L'URL suit le format : `BUCKET.s3-website.REGION.amazonaws.com`
5. Pour HTTPS, utilisez CloudFront en front du bucket
6. Pour un domaine personnalisé, utilisez Route 53 + CloudFront + ACM
7. S3 ne peut pas exécuter de code côté serveur (PHP, Node.js, etc.)
