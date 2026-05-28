---
title: "TP : Lancer une instance EC2 Free Tier"
description: Lancer et configurer une instance EC2 éligible au Free Tier AWS.
---

1. Se connecter à la console AWS.

2. Ouvrir le service **EC2**.

3. Cliquer sur **Launch instance**.

4. Renseigner un nom d'instance.

5. Choisir une AMI marquée **Free tier eligible**.

6. Choisir un type d'instance marqué **Free tier eligible** :
   - `t2.micro` si disponible ;
   - sinon `t3.micro` selon la région et le type de compte.

7. Créer ou sélectionner une **key pair**.

8. Configurer le réseau :
   - VPC par défaut ;
   - subnet par défaut ;
   - auto-assign public IP activé.

9. Configurer le Security Group :
   - SSH `22` depuis votre IP uniquement ;
   - HTTP `80` uniquement si nécessaire ;
   - HTTPS `443` uniquement si nécessaire.

10. Configurer le stockage :
    - garder un volume EBS dans la limite Free Tier.

11. Vérifier le résumé.

12. Cliquer sur **Launch instance**.

13. Aller dans **Instances**.

14. Attendre l'état **Running**.

15. Se connecter à l'instance avec SSH.

16. Arrêter ou supprimer l'instance après usage pour éviter les coûts.
