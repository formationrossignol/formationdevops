---
title: "TP : SQS Free Tier"
description: Envoyer et lire des messages avec Amazon SQS en Free Tier.
---

## Objectif

Créer une file SQS, envoyer et recevoir des messages via la console AWS et l'AWS CLI, et comprendre le comportement du délai de visibilité.

## Durée estimée

30 minutes

## Coût

100% gratuit — Free Tier SQS : 1 million de requêtes/mois

---

## Étape 1 : Créer une file SQS

Dans AWS Console :

1. Allez dans **Amazon SQS**
2. Cliquez sur **Create queue**
3. Choisissez **Standard queue**
4. Nom : `tp-sqs-test`
5. Laissez les options par défaut
6. Cliquez sur **Create queue**

---

## Étape 2 : Envoyer un message manuellement

Dans la file `tp-sqs-test` :

1. Cliquez sur **Send and receive messages**
2. Dans **Message body**, entrez par exemple :

```json
{
  "event": "test",
  "message": "Bonjour depuis SQS"
}
```

3. Cliquez sur **Send message**

---

## Étape 3 : Lire le message

Toujours dans **Send and receive messages** :

1. Cliquez sur **Poll for messages**
2. Le message apparaît dans la liste
3. Ouvrez-le pour voir son contenu

Le principe de base est maintenant validé :

```
Producteur → SQS → Consommateur
```

---

## Étape 4 : Supprimer le message

Après lecture :

1. Sélectionnez le message
2. Cliquez sur **Delete**
3. Confirmez

> Dans SQS, lire un message ne le supprime pas automatiquement. La suppression est explicite.

---

## Étape 5 : Tester avec AWS CLI

Récupérez l'URL de la queue dans la console (onglet **Details** de la file).

Envoyer un message :

```bash
aws sqs send-message \
  --queue-url "URL_DE_TA_QUEUE" \
  --message-body '{"message":"Test depuis AWS CLI"}'
```

Lire un message :

```bash
aws sqs receive-message \
  --queue-url "URL_DE_TA_QUEUE"
```

Supprimer un message (le `receipt-handle` est retourné par `receive-message`) :

```bash
aws sqs delete-message \
  --queue-url "URL_DE_TA_QUEUE" \
  --receipt-handle "RECEIPT_HANDLE_DU_MESSAGE"
```

---

## Étape 6 : Tester le délai de visibilité

1. Envoyez un message
2. Cliquez sur **Poll for messages**
3. Ne le supprimez pas
4. Attendez environ 30 secondes
5. Cliquez de nouveau sur **Poll for messages**

Le message réapparaît, car il n'a pas été supprimé après lecture.

C'est le comportement clé de SQS :

```
Un message lu devient invisible temporairement.
S'il n'est pas supprimé, il redevient disponible.
```

---

## Nettoyage

1. SQS → sélectionnez `tp-sqs-test` → **Delete**
2. Confirmez

---

## Points clés

1. SQS est un service de file de messages managé et serverless
2. Lire un message ne le supprime pas — il faut une suppression explicite
3. Le délai de visibilité empêche deux consommateurs de traiter le même message simultanément
4. Free Tier : 1 million de requêtes/mois
5. Les Standard queues garantissent la livraison mais pas l'ordre — utiliser FIFO queues pour l'ordre strict
