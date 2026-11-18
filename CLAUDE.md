# CLAUDE.md — Projet HelpUP (workshop Full Stack JS, Efrei M1)

## Contexte
- Étudiant : Romain (Efrei, Mastère M1 Manager Développeur Full Stack). Réponds en français.
- Repo : `~/Documents/GIT-LOCAL/full-stack-js` (Linux, machine « rog »).
- Workshop de 4 jours (28 h), puis une soutenance de 10 minutes.
- Trois documents de référence (PDF) :
  1. **Projet_HelpUP** : le concept de l'application.
  2. **ORAL_DevFullStack** : les consignes et la grille de la présentation finale.
  3. **LIVRET_ETUDIANT_V2** : le cahier des charges, avec le contrat d'API et les TP.

## Le produit : HELP'UP
Une application de mini-jobs rémunérés entre particuliers, dans le même quartier : tonte, déménagement, courses, garde d'enfants ou d'animaux, montage de meubles, soutien scolaire, petit bricolage.
- **Prestataires** : jeunes de 16 à 25 ans, étudiants, personnes disponibles ponctuellement.
- **Clients** : actifs débordés, personnes âgées, familles.
- **Parcours** :
  1. Le client publie une mission.
  2. Les jeunes à proximité sont notifiés.
  3. Ils postulent.
  4. Le paiement se fait dans l'application ou sur place.
  5. Chacun note l'autre après la mission.
- **Modèle économique** : commission de 10 à 15 %, profil premium pour les prestataires, partenariats locaux. Hors du périmètre du MVP technique.

## Stack imposée (le livret interdit de la remplacer)
- **Langage** : **TypeScript** (accord du formateur obtenu ; à mentionner en soutenance, le livret dit JavaScript par défaut). Seuls les scripts mongosh (`backend/sql`, `backend/migration`) restent en JS.
- **Front** : React 19 avec Vite 8, et `react-router-dom`. Pas de Next.js.
- **Back** : Node.js et Express 5, organisé en routes, contrôleurs, services et modèles.
- **Base de données** : MongoDB avec Mongoose.
- **Authentification** : bcrypt pour le hachage, JWT signé avec `JWT_SECRET`, middleware qui lit le jeton `Bearer`.
- **Sécurité** (audit : `docs/securite.md`, tests d'attaque : `backend/tests/security.test.ts`) : bcrypt coût 12 (4 sous Jest) avec re-hachage à la connexion ; JWT HS256 + `iss`/`aud` vérifiés, 1 h par défaut, secret ≥ 32 caractères (refus en production) ; `express-rate-limit` (connexion 10 échecs/15 min, inscription 20/h, API 300/min, coupé sous Jest sauf `RATE_LIMIT_IN_TESTS=true`) ; `securityLog` (JSON, jamais d'email/mot de passe/jeton) ; `Cache-Control: no-store` ; 413 au format commun ; ports Docker sur 127.0.0.1 ; `TRUST_PROXY` ; CSP et en-têtes du front dans `vite.config.ts` (CSP seulement en `preview`, pas en dev à cause du HMR) ; Dependabot.
- **Validation** : zod, côté serveur. Elle est obligatoire même si React valide déjà les formulaires.
- **Qualité** : ESLint (flat config) côté front et côté back. oxlint a été retiré. `typescript-eslint` des deux côtés ; `npm run typecheck` (tsc) en plus du lint.
- **Tests** : Jest et Supertest, avec `mongodb-memory-server` comme base isolée.
- **Documentation** : README.md, `.env.example` sans aucun secret, Swagger/OpenAPI (`swagger-ui-express` et `yaml`).

## État actuel (une branche par feature, ex. `feat/applications` pour Romain ; Romain commite et pousse lui-même)
```
full-stack-js/
├── compose.yaml              # mongo:7.0 (auth, hôte 127.0.0.1:27017), backend, frontend, mongo-express (profil "tools", auth)
├── .env.example              # SEUL fichier d'env du projet : MONGO_ROOT_*, MONGO_APP_*, ME_*, JWT_*, CORS_ORIGIN, VITE_API_URL ; le vrai .env est ignoré
├── mongo/init/01-create-app-user.js   # crée l'utilisateur applicatif au 1er démarrage (volume vide)
├── .gitignore                # node_modules/, builds, tous les .env sauf .env.example, logs, éditeurs
├── frontend/                 # modèle Vite react, ESLint ; vite.config.js `envDir: '..'` (lit le .env racine) — jamais de secret préfixé VITE_ (exposé au navigateur)
└── backend/
    ├── src/server.ts         # dotenv + mongoose.connect + app.listen(PORT) ; importe ./api/app
    ├── src/constants/        # categories.ts, quartiers.ts (Paris sud + Villejuif, [lng, lat]), statuses.ts, roles.ts, notifications.ts : source unique, `as const` + types (CategorySlug, QuartierSlug, MissionStatus…) ; *_SLUGS = tuples pour z.enum
    ├── src/models/           # user.model.ts (Nicolas), mission.model.ts, application.model.ts, review.model.ts, notification.model.ts (TTL 90 j), message.model.ts (messagerie privée) (exports nommés Mission/Application/Review/Notification/Message, index nommés comme dans sql/seed.js, versionKey false) ; plugins/toJSON.ts (_id→id) ; events/missionEvents.ts (émis par le hook post-save de Mission, écouté par notification.service)
    ├── src/api/              # TOUTE la logique HTTP (Express) ; ne dépend que de models/ et constants/
    │   ├── app.ts            # helmet, cors, json(100kb), GET /api/health, Swagger /api/docs (+ /api/docs/openapi.json), routeurs /api/{auth,users,explore,missions,applications,dashboard,reviews,notifications,conversations}, puis notFoundHandler (sur /api) + errorHandler ; n'ouvre pas de port. userReviews monté avant user.routes et missionApplications avant missions.routes (sinon double requireAuth)
    │   ├── routes/           # *.routes.ts : auth, user (Nicolas), explore (Yaël : /api/explore/missions[/:id]), missions (Nicolas : GET/POST/GET :id/PATCH cloisonnés par ownerId ; PATCH seulement si `open` sinon 409, condition atomique dans findOneAndUpdate, location recalculée depuis quartier ; un membre ne supprime pas, il masque (`hidden`, exclu de /api/explore et refusé à la candidature → 404) ; DELETE réservé admin (requireRole), toute mission quel que soit le statut, supprime candidatures + notifications liées). user : DELETE /me et DELETE /:id (admin) : 409 si mission `assigned` (owner ou provider), supprime missions `open` + leurs candidatures, candidatures `pending` → `withdrawn`, supprime ses notifications. Romain : applications (/api/applications CRUD de MES candidatures), missionApplications (/api/missions/:id/applications, …/:appId/accept|reject, /:id/complete), dashboard (/api/dashboard : stats, published, obtained, history + myReview), reviews (/api/reviews CRUD de MES avis), userReviews (/api/users/:id/reviews : avis reçus + moyenne), notifications (/api/notifications : liste + unreadCount, unread-count, read-all, PATCH {read}, DELETE ; créées seulement par le serveur via `notify.*` de notification.service, et « mission_nearby » via models/events/missionEvents). Nicolas : conversations (/api/conversations : liste, unread-count, /:id, /:id/messages GET ?after= / POST ; id de conversation = id de mission ; seuls ownerId et providerId y accèdent, sinon 404 ; écriture seulement si mission `assigned` sinon 409 ; messageLimiter 30/min ; notification `message_received` une seule tant que non lu ; messages supprimés avec la mission (admin) et le compte). Validation dans les contrôleurs : schema.parse(req.body), la ZodError part vers error.middleware
    │   ├── {controllers,services,validators}/   # auth, user, mission, message (Nicolas), explore (Yaël), application, dashboard, review, notification (Romain)
    │   ├── middlewares/      # error.middleware.ts (base commune : headersSent, AppError, ZodError 400, JSON invalide 400, CastError/ValidationError 400, 11000 → 409 EMAIL_ALREADY_USED si index email sinon CONFLICT, sinon 500) ; auth.middleware.ts (requireAuth : Bearer JWT {sub}, recharge l'utilisateur → req.user / req.userId, sinon 401 ; requireRole) ; validate.ts (validate(schema) = schema.parse(req.body))
    │   ├── utils/            # errors.ts (AppError(status, code, message) + BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError), jwt.ts, password.ts, objectId.ts (isObjectId, toObjectId → BadRequestError), publicPerson.ts (prénom + initiale + ville), openapi.ts (loadOpenApi : assemble openapi/ en un document, refs vers la racine → refs locales)
    │   ├── types/express.d.ts # req.user, req.userId
    │   └── openapi/          # contrat OpenAPI découpé (openapi.yaml racine + paths/ une ressource par fichier + components/) ; textes en anglais (messages d'erreur renvoyés restent en français, affichés par le front) ; x-status implemented|todo ; conventions dans son README.md ; copié dans dist/api/openapi au build
    ├── sql/seed.js           # mongosh autonome : base vide (collections + $jsonSchema + index), relançable ; exécutable sur Atlas (Compass > MONGOSH ou docker mongosh)
    ├── migration/seed-demo.js # mongosh autonome : structure (copie de sql/seed.js) + démo déterministe, comptes @helpup.test (mdp password123, hash bcrypt en dur) ; RESET=true ne touche que la démo ; pas de JWT
    ├── scripts/mongosh.sh    # npm run db:demo | db:create : lance le script via docker mongo:7.0 sur MONGODB_URI du fichier d'env racine ; s'arrête si une base de même nom/autre casse existe (ex. HelpUP)
    ├── tests/                # health, errors (format d'erreur + validate, sans base), docs (Swagger + cohérence du contrat src/api/openapi), auth, user, explore, missions (CRUD, 400, 401, isolation A/B, 409), account-deletion, applications, dashboard, reviews, notifications, messages (mongodb-memory-server, helpers tests/setup.ts) — Jest + ts-jest + Supertest
    ├── tsconfig.json         # NodeNext (sortie CommonJS), strict, types node+jest, noEmit (typecheck src+tests)
    ├── tsconfig.build.json   # build src/ → dist/
    └── eslint.config.js      # flat config CJS : typescript-eslint pour *.ts, globales mongosh pour sql/ et migration/
```
- Backend en TypeScript, syntaxe `import`/`export`, compilé en CommonJS (`module: NodeNext` + `"type": "commonjs"`) : imports relatifs sans extension. Frontend en TypeScript ESM (`tsconfig.app.json` pour src, `tsconfig.node.json` pour vite.config.ts, `src/vite-env.d.ts` type `VITE_API_URL`).
- Scripts du backend : `dev` (`tsx watch src/server.ts`), `build` (tsc → dist/ + copie src/api/openapi), `start` (`node dist/server.js`), `typecheck`, `test` (`NODE_OPTIONS=--experimental-vm-modules jest --runInBand`, preset ts-jest, timeout 30 s ; sans ce flag, le driver mongodb 7.8 ne peut pas faire son `import('os')` dans Jest et toute connexion mongodb-memory-server échoue avec « Missing required sub-document 'driver' »), `lint`, `db:create`, `db:demo`.
- Scripts du frontend : `dev`, `build` (`tsc -b && vite build`), `typecheck`, `lint`, `preview`.
- Docker Compose :
  - Mode développement : le code est monté en volume et les `node_modules` sont dans des volumes nommés.
  - Les secrets viennent du `.env` racine (lu par Compose) ; une variable manquante bloque le démarrage (`${VAR:?}`).
  - Le backend n'a pas d'`env_file` : le compose lui passe une liste explicite (`PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `MONGODB_URI`) pour qu'il ne voie jamais le mot de passe root. Ajouter une variable backend = l'ajouter dans `.env.example` ET dans `environment:` du service backend. Le frontend reçoit seulement `VITE_API_URL` (Vite lit les `VITE_*` de l'environnement du conteneur).
  - Le compose construit `MONGODB_URI` : `mongodb://${MONGO_APP_USER}:${MONGO_APP_PASSWORD}@mongo:27017/helpup?authSource=helpup`.
  - Mongo : authentification activée ; le backend utilise un compte `readWrite` limité à `helpup`, jamais le compte root.
  - mongo-express : se connecte en root, protégé par login (`ME_USER`/`ME_PASSWORD`), lancé avec `docker compose --profile tools up`.
  - Ports `27017` et `8081` liés à `127.0.0.1` uniquement. En production : retirer les `ports` de mongo, ne pas déployer mongo-express, régénérer les mots de passe.
  - Le script de `mongo/init/` ne s'exécute que si le volume `mongo-data` est vide : après un changement d'identifiants, `docker compose down -v` (efface les données).
  - Le backend attend que le healthcheck de Mongo réponde avant de démarrer.

## Environnement Docker (résolu le 2026-11-16)
`docker compose up -d` fonctionne : `curl localhost:3000/api/health` renvoie `{"status":"ok"}`, le front répond sur http://localhost:5173.
- Docker Desktop (contexte `desktop-linux`) ; s'il n'est pas lancé : `systemctl --user start docker-desktop`.
- **`mongo:7.0` et pas 8** : la VM Docker Desktop a le noyau `7.0.12-linuxkit`, que MongoDB 8 refuse (6.19.0 à 7.0.13, [SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912)). Repasser en 8 possible après mise à jour de Docker Desktop.
- **Port hôte 27017** : les conteneurs d'autres cours `mongodb-cours` (27017) et `db-phpmyadmin-1` (8080) ont été arrêtés (`unless-stopped`, ils ne redémarrent pas seuls ; `docker start <nom>` pour les relancer, en arrêtant HelpUP avant pour `mongodb-cours`). `mongodb-exercice1` tourne encore sur 27018, sans conflit.

npm 11.19 affiche des warnings `install-scripts not yet covered by allowScripts` pour bcrypt, mongodb-memory-server et quelques autres paquets. À vérifier avec `node -e "require('bcrypt').hashSync('x',10)"`. S'il le faut : `npm install-scripts approve bcrypt mongodb-memory-server`.

## Charte graphique
- Référence : `docs/charte-graphique.md` (basée sur le skill global `apple-design`, HIG Apple). Tout le style du frontend en découle.
- Vert `#174F40` = marque et action principale ; orange `#F3A66B` = signal (urgent/nouveau) uniquement, **jamais en texte sur fond clair** (1,85:1).
- Couleurs uniquement via les variables CSS sémantiques (section 12), mode sombre via `prefers-color-scheme`, sans bouton propre au site.
- **Accessibilité WCAG 2.2 AAA** (au-delà du RGAA 4.1) : `docs/accessibilite.md`. Texte ≥ 7:1 en clair et en sombre, cibles ≥ 44 px (`--target-min`, y compris `.btn--sm`), anneau de focus 3 px (`--focus-ring-width`), lien d'évitement + `RouteAnnouncer` (titre d'onglet, focus sur le h1, annonce), filtres en `aria-pressed` (pas de `role="tablist"`), `useDraft` pour garder une saisie si la session expire, `prefers-contrast`/`forced-colors`/`prefers-reduced-motion` gérés.
- Plus Jakarta Sans (titres, prix) + police système (texte, contrôles). Icônes Lucide. Carte Leaflet + OpenStreetMap.

## Contrat API v1 du livret (à respecter exactement)
- Toutes les routes commencent par `/api`, en JSON UTF-8. Le port vient de `PORT`.
- `GET /api/health` est public et renvoie `200 {"status":"ok"}`.
- `POST /api/auth/register` avec `{email, password}` renvoie `201 {"user":{"id","email"},"token"}`.
  - L'email est insensible à la casse. Le mot de passe fait au moins 8 caractères et est stocké en hash bcrypt.
  - Email déjà utilisé : `409 EMAIL_ALREADY_USED`.
- `POST /api/auth/login` renvoie `200`, avec le même schéma que register.
  - En cas d'échec : `401 UNAUTHORIZED`, sans dire si c'est l'email ou le mot de passe qui est faux.
- Les routes métier exigent `Authorization: Bearer <JWT>`. Jeton absent, invalide ou expiré : `401`.
- `ownerId` est calculé uniquement côté serveur, à partir du JWT.
  - Un objet qui appartient à un autre utilisateur renvoie `404`, comme un objet absent.
  - Un id mal formé renvoie `400`.
- Les réponses exposent `id` (l'ObjectId sous forme de chaîne), jamais `_id`. Elles ne contiennent jamais `password`, `passwordHash` ni de secret.
- Un `id` ou un `ownerId` présent dans le corps d'un POST ou d'un PATCH renvoie `400`.
  - Le PATCH est partiel et ne peut pas être vide.
  - Un champ inconnu ou invalide renvoie `400`.
- Le CRUD suit ce format :

  | Méthode | Route | Réponse |
  |---|---|---|
  | `GET` | `/api/<res>` | `200 {"items":[...]}` (`{"items":[]}` si vide) |
  | `POST` | `/api/<res>` | `201` avec l'objet créé |
  | `GET` | `/api/<res>/:id` | `200` |
  | `PATCH` | `/api/<res>/:id` | `200` |
  | `DELETE` | `/api/<res>/:id` | `204` sans corps |

- Format d'erreur commun : `{"error":{"code":"INVALID_INPUT|UNAUTHORIZED|NOT_FOUND|EMAIL_ALREADY_USED","message":"..."}}`.
- Tests minimum :
  1. un parcours CRUD nominal ;
  2. une donnée invalide qui renvoie 400 ;
  3. un appel sans JWT qui renvoie 401 ;
  4. l'utilisateur B qui ne peut ni lire ni modifier les objets de A (404).

## Point ouvert avec le formateur
- Le livret décrit un projet **individuel**, avec un catalogue fermé : TaskFlow (`/api/tasks`), HabitLab (`/api/habits`) ou BudgetFlow (`/api/transactions`).
- La fiche d'oral et le sujet HelpUP décrivent un projet **de groupe** sur un concept libre.
- Il faut faire confirmer ce qui s'applique. Quel que soit le cas, on garde les règles transversales du contrat d'API.

## Plan d'équipe (Nicolas, Romain, Yaël)
- Référence : `docs/plan-features.md` (répartition, contrat d'API, Gantt). Nicolas = auth, profils, CRUD missions ; Yaël = seed, squelette front, recherche (`/api/explore/missions`), carte ; Romain = candidatures (`/api/applications`), statuts, tableau de bord.
- Modèle de données de référence : `docs/modele-donnees.md` (anglais camelCase, argent en centimes, `providerId` = prestataire, `location` calculé depuis `quartier`).
- Rôles `client` / `admin` (le plan initial n'en prévoyait pas) : l'admin change les rôles, supprime des comptes et des missions. Localisation par liste fixe de quartiers, seul le flux candidatures change le statut d'une mission.
- Front missions : `/missions` (catalogue, boutons Publier / Mes missions), `/missions/mine` (MyMissionsPage : filtres statut, Modifier, Masquer/Réafficher), `/missions/new` et `/missions/:id/edit` (MissionFormPage, PATCH avec les seuls champs modifiés), bloc Modération admin dans MissionDetailPage. Messagerie : `/messages` (ConversationsPage) et `/messages/:id` (ConversationPage, polling 5 s avec `?after=`), lien « Messages » + pastille dans la Navbar (`usePolledCount`, 30 s), boutons « Écrire à … » dans le Dashboard. `frontend/src/constants/quartiers.ts` recopie la liste du backend.

## Proposition pour HelpUP (version initiale, remplacée par le plan d'équipe)
- Ressource principale : `/api/missions` (titre, description, catégorie, prix en centimes, date, adresse ou ville, statut `open|assigned|done|cancelled`, `ownerId`).
- Ressources secondaires, en bonus : candidatures (`/api/missions/:id/applications`) et avis après une mission.

## Prochaines étapes (TP du livret)
- **TP2** : routes, contrôleur et service pour la ressource métier, d'abord avec une liste en mémoire.
- **TP3** : modèle Mongoose, CRUD persistant, gestion d'erreurs centralisée, `ownerId`.
- **TP4 et TP5** : modèle User, register/login, middleware JWT, isolation entre les comptes A et B.
- **TP6** : écrans React (inscription, connexion, liste, création, détail/édition, suppression avec confirmation).
- **TP7 à TP9** : refactoring, lint et build, tests Jest/Supertest, Swagger, README complet.

## Critères de la soutenance (sur 20 points)
| Critère | Points |
|---|---|
| Fonctionnalités et intégration full stack | 6 |
| Architecture et qualité du code | 5 |
| Robustesse, validation, sécurité et tests | 4 |
| Organisation et travail d'équipe | 2 |
| Clarté de la présentation et de la démo | 3 |

- Démo en direct obligatoire, avec des comptes et des données de test prêts.
- Il faut savoir expliquer le flux JWT et pourquoi la sécurité se fait dans Express, et pas seulement dans React.
- Un MVP simple et maîtrisé vaut mieux qu'une application ambitieuse mais inachevée.
