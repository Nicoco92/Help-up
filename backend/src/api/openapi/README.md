# Contrat de l'API HelpUP (OpenAPI 3)

Ce dossier est la **source unique du contrat HTTP** : routes, corps acceptés, réponses et erreurs.
Le backend l'assemble au démarrage (`backend/src/api/utils/openapi.ts`) et le sert :

- Swagger UI : http://localhost:3000/api/docs (bouton « Authorize » pour coller un JWT) ;
- document assemblé en JSON : http://localhost:3000/api/docs/openapi.json.

On écrit le contrat **avant** le code (approche *API first*) : le front peut s'appuyer dessus
pendant que le back implémente les routes.

## Organisation

```
backend/src/api/openapi/
├── openapi.yaml              # point d'entrée : info, tags, sécurité, et $ref vers tout le reste
├── paths/                    # une ressource par fichier (un propriétaire par fichier)
│   ├── health.yaml
│   ├── auth.yaml             # register (= Create des utilisateurs), login
│   ├── users.yaml            # /api/users, /me, /{id}, /{id}/role
│   ├── missions.yaml         # CRUD /api/missions (mes missions)
│   ├── applications.yaml     # /api/applications, /api/missions/{id}/applications[/…/accept|reject]
│   ├── dashboard.yaml        # /api/dashboard, /api/missions/{id}/complete
│   ├── reviews.yaml          # /api/reviews, /api/users/{id}/reviews
│   ├── notifications.yaml    # /api/notifications[/unread-count|/read-all|/{id}]
│   └── conversations.yaml    # /api/conversations[/unread-count|/{id}|/{id}/messages] (messagerie privée)
└── components/
    ├── parameters.yaml       # IdPath, ApplicationIdPath
    ├── responses.yaml        # InvalidInput, Unauthorized, Forbidden, NotFound, Conflict
    └── schemas/              # common, auth, users, missions, applications, dashboard, reviews, notifications, conversations
```

## Routes

| Méthode | Route | Statut |
|---|---|---|
| `POST` | `/api/auth/register` · `/api/auth/login` | fait |
| `GET` | `/api/users` | fait |
| `GET` `PATCH` `DELETE` | `/api/users/me` | fait |
| `GET` | `/api/users/{id}` | fait |
| `DELETE` | `/api/users/{id}` (admin) | fait |
| `PATCH` | `/api/users/{id}/role` (admin) | fait |
| `GET` `POST` | `/api/missions` | fait |
| `GET` `PATCH` `DELETE` | `/api/missions/{id}` | fait |
| `GET` | `/api/missions/{id}/applications` | fait |
| `POST` | `/api/missions/{id}/applications/{applicationId}/accept` · `…/reject` | fait |
| `POST` | `/api/missions/{id}/complete` | fait |
| `GET` `POST` | `/api/applications` | fait |
| `GET` `PATCH` `DELETE` | `/api/applications/{id}` | fait |
| `GET` | `/api/dashboard` | fait |
| `GET` `POST` | `/api/reviews` | fait |
| `GET` `PATCH` `DELETE` | `/api/reviews/{id}` | fait |
| `GET` | `/api/users/{id}/reviews` | fait |
| `GET` | `/api/notifications` · `/api/notifications/unread-count` | fait |
| `POST` | `/api/notifications/read-all` | fait |
| `GET` `PATCH` `DELETE` | `/api/notifications/{id}` | fait |
| `GET` | `/api/conversations` · `/api/conversations/unread-count` · `/api/conversations/{id}` | fait |
| `GET` `POST` | `/api/conversations/{id}/messages` | fait |

Le Create des utilisateurs reste `POST /api/auth/register` : il renvoie aussi le JWT, un
`POST /api/users` ferait doublon.

## Conventions

1. **Ajouter une route** : l'écrire dans `paths/<ressource>.yaml` sous une clé (ex. `mission-by-id`),
   puis la brancher dans `openapi.yaml` :
   `/api/missions/{id}: { $ref: './paths/missions.yaml#/mission-by-id' }`.
2. **Ajouter un schéma** : l'écrire dans `components/schemas/<ressource>.yaml`, puis le déclarer
   sous `components.schemas` dans `openapi.yaml` (sinon il n'a pas de nom dans Swagger).
3. **Référencer un composant** depuis un sous-fichier : toujours passer par le fichier racine,
   par exemple `$ref: '../openapi.yaml#/components/schemas/Mission'` (ou `../../openapi.yaml`
   depuis `components/schemas/`). Une référence locale `#/...` hors de la racine est refusée au démarrage.
4. **Statut d'implémentation** : chaque opération porte `x-status: implemented | todo`, et les
   routes `todo` ont « · not implemented yet » à la fin de leur `summary`. Une fois la route codée et testée,
   passer à `implemented` et retirer le suffixe.
5. **Langue** : les textes du contrat (summary, description, commentaires) sont en **anglais**. Les messages
   d'erreur renvoyés par l'API restent en français, car le front les affiche tels quels.
6. Chaque opération a un `operationId` unique (vérifié par `backend/tests/docs.test.ts`).
7. Toutes les routes exigent le JWT par défaut ; mettre `security: []` sur une route publique.
8. Corps d'entrée : `additionalProperties: false` (champ inconnu → `400`), `minProperties: 1` pour un PATCH.
   Les listes (catégories, quartiers, statuts, rôles) recopient `backend/src/constants/` : à garder synchronisées.

## Vérifier

```bash
cd backend && npm test -- docs
```

Le test charge le contrat, vérifie que toutes les références pointent vers un composant existant,
que les routes CRUD sont présentes et que chaque opération a un `operationId` et un `x-status`.
