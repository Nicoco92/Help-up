
# Fondations (sprint 0) — à merger avant de coder les features

Objectif : **1 h 30**, puis chacun code sa feature dans ses propres fichiers sans attendre les autres.
Règle : une branche par personne, **une PR chacun, mergée dans `main` avant 11 h**. Vérifier avant la PR : `npm run typecheck && npm run lint && npm test`.

## Qui fait quoi

| Qui               | Fichier                                                                          | Contrat (ce que les autres utilisent)                                                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Romain**  | `src/utils/AppError.ts`                                                        | `throw new AppError(status, code, message)` ; `type ErrorCode = 'INVALID_INPUT' \| 'UNAUTHORIZED' \| 'NOT_FOUND' \| 'EMAIL_ALREADY_USED' \| 'CONFLICT'`                                            |
|                   | `src/middlewares/errorHandler.ts`                                              | `notFound` + `errorHandler` → toujours `{"error":{"code","message"}}` (AppError, zod → 400, JSON cassé → 400, id mal formé → 400, doublon `11000` → 409, reste → 500 sans détail) |
|                   | `src/middlewares/validate.ts`                                                  | `validate(schema)` sur `req.body` ; schémas en `z.strictObject` (champ inconnu, `id`, `ownerId` → 400)                                                                                 |
|                   | `src/utils/toJSON.ts`                                                          | plugin Mongoose : `id` au lieu de `_id`, sans `__v` ni `passwordHash`                                                                                                                      |
|                   | `src/models/Mission.ts`, `src/models/Application.ts`                         | champs **exactement** comme `docs/modele-donnees.md` ; `location` calculé depuis `quartier`                                                                                           |
|                   | `src/routes/{auth,users,missions,explore,applications}.routes.ts` + `app.ts` | 5 routeurs **vides** déjà branchés dans `app.ts`, puis `notFound` et `errorHandler` en dernier                                                                                      |
| **Nicolas** | `src/models/User.ts`                                                           | champs du modèle de données, `passwordHash` en `select: false`                                                                                                                               |
|                   | `src/utils/jwt.ts`                                                             | `signToken(userId)` → JWT `{ sub: userId }`, expiration `JWT_EXPIRES_IN`                                                                                                                    |
|                   | `src/middlewares/requireAuth.ts`                                               | lit `Authorization: Bearer …` → `req.userId` (string) ; absent/invalide/expiré → `AppError` 401                                                                                          |
|                   | `src/types/express.d.ts`                                                       | ajoute `userId?: string` au type `Request` d'Express                                                                                                                                           |
|                   | `scripts/dev-token.ts`                                                         | `npx tsx scripts/dev-token.ts alice.martin@helpup.test` → affiche un JWT (en attendant l'écran de connexion)                                                                                   |
| **Yaël**   | `frontend/src/styles/tokens.css`                                               | variables CSS de la charte (§12)                                                                                                                                                                  |
|                   | `frontend/src/services/api.ts`                                                   | client unique (`authApi`, `usersApi`, `exploreApi`) : préfixe `VITE_API_URL`, ajoute le jeton (`localStorage['helpup.token']`), lève `ApiError` sur `{"error":…}`                                                         |
|                   | `frontend/src/App.tsx` + `pages/`                                            | routeur avec toutes les pages **vides** (une par feature) + layout/navigation                                                                                                                |

## Ordre et dépendances

```
Romain : AppError → errorHandler → validate → toJSON → Mission, Application → routeurs vides + app.ts
Nicolas : User (utilise toJSON*) → jwt → requireAuth (utilise AppError*) → dev-token
Yaël    : tokens.css → client API → routeur + pages vides
```

\* Nicolas n'attend pas : il code contre le contrat ci-dessus et rebase sur `main` dès que la PR de Romain est mergée.
**Romain merge en premier** (AppError + toJSON en priorité, ~30 min), puis Nicolas, puis Yaël (indépendant).

## Après le merge : chacun chez soi

| Qui     | Ne touche qu'à                                                                                                                                                   |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nicolas | `routes/auth`, `routes/users`, `routes/missions` + services, contrôleurs, validateurs associés ; pages connexion, inscription, profil, formulaire mission |
| Yaël   | `routes/explore` + services ; pages recherche, détail, carte                                                                                                   |
| Romain  | `routes/applications` + services ; pages « Mes candidatures », tableau de bord                                                                                |

Fichiers partagés (`AppError`, `errorHandler`, modèles, `app.ts`, `client.ts`) : **on prévient avant de les modifier.**
Chaque jour : `git pull --rebase` sur `main` le matin, PR mergées à 12 h et 17 h.
