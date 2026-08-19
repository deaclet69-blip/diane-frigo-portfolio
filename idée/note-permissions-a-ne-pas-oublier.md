# À ne pas oublier sur une prochaine appli — leçon tirée de Diane Frigo

## Le problème qu'on a eu

J'avais un système de permissions par case à cocher **uniquement côté
frontend** (page Utilisateurs → cases "Rapports", "Rentabilité", etc.).
Le backend, lui, ne vérifiait que le **rôle** (ADMIN/RESPONSABLE/VENDEUR/
MAGASINIER), codé en dur sur chaque route.

Résultat : cocher une page pour un utilisateur ne servait à rien — le
serveur refusait quand même. Et comme aucune page n'affichait de message
d'erreur, ça donnait l'impression que "les données avaient disparu".

## Les 2 règles à appliquer dès le départ, la prochaine fois

### 1. Une seule source de vérité pour les permissions — et c'est le backend

- Ne jamais se dire "le frontend gère déjà l'affichage, ça suffit". Le
  frontend ne fait que **cacher un bouton** — n'importe qui peut appeler
  l'API directement. La vraie protection doit toujours être côté serveur.
- Si je veux un système "cases à cocher par page" : je crée la table
  de permissions **et** un vrai contrôle serveur (guard/middleware) qui
  lit ces permissions sur **chaque route**, dès la première version.
  Je ne fais pas d'abord le frontend "pour voir", en me disant que je
  brancherai le backend plus tard — c'est exactly ce qui a créé le bug.
- Dès qu'un rôle ou une permission protège une page côté frontend, je
  vérifie tout de suite que la ou les routes API correspondantes ont
  la même protection. Un tableau simple (page → clé de permission →
  route API protégée ?) suffit pour ne rien oublier.

### 2. Aucun appel à l'API sans gestion d'erreur visible

- Toujours prévoir, dès le départ, un système global qui affiche un
  message clair si une requête échoue (accès refusé, erreur serveur,
  pas de connexion...). Jamais une page qui reste vide en silence.
- Le plus simple : un seul petit composant "notification d'erreur"
  branché une fois sur l'intercepteur des requêtes (axios ou autre),
  pas besoin de le refaire dans chaque page.

## Question à se poser avant de coder une nouvelle appli avec des comptes utilisateurs

> "Si je décoche une page pour un utilisateur, qu'est-ce qui l'empêche
> concrètement d'accéder aux données s'il tape l'adresse ou appelle
> l'API directement ?"

Si la réponse est "rien, je compte sur le frontend" → il manque la
protection côté serveur. C'est le moment de l'ajouter, pas après.
