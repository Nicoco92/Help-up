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
- **Langage** : JavaScript (pas de TypeScript, sauf accord du formateur).
- **Front** : React 19 avec Vite 8, et `react-router-dom`. Pas de Next.js.
- **Back** : Node.js et Express 5, organisé en routes, contrôleurs, services et modèles.
- **Base de données** : MongoDB avec Mongoose.
- **Authentification** : bcrypt pour le hachage, JWT signé avec `JWT_SECRET`, middleware qui lit le jeton `Bearer`.
- **Validation** : zod, côté serveur. Elle est obligatoire même si React valide déjà les formulaires.
- **Qualité** : ESLint (flat config) côté front et côté back. oxlint a été retiré.
- **Tests** : Jest et Supertest, avec `mongodb-memory-server` comme base isolée.
- **Documentation** : README.md, `.env.example` sans aucun secret, Swagger/OpenAPI (`swagger-ui-express` et `yaml`).

## État actuel (rien de commité après `041517e first commit` : Romain fait le commit initial lui-même)
```
full-stack-js/
├── compose.yaml              # mongo:7.0 (auth, hôte 127.0.0.1:27017), backend, frontend, mongo-express (profil "tools", auth)
├── .env.example              # SEUL fichier d'env du projet : MONGO_ROOT_*, MONGO_APP_*, ME_*, JWT_*, CORS_ORIGIN, VITE_API_URL ; le vrai .env est ignoré
├── mongo/init/01-create-app-user.js   # crée l'utilisateur applicatif au 1er démarrage (volume vide)
├── .gitignore                # node_modules/, builds, tous les .env sauf .env.example, logs, éditeurs
├── frontend/                 # modèle Vite react, ESLint ; vite.config.js `envDir: '..'` (lit le .env racine) — jamais de secret préfixé VITE_ (exposé au navigateur)
└── backend/
    ├── src/app.js            # app Express (helmet, cors, json) + GET /api/health ; n'ouvre pas de port
    ├── src/server.js         # dotenv + mongoose.connect + app.listen(PORT)
    ├── src/constants/        # categories.js, quartiers.js (Paris sud + Villejuif, [lng, lat]), statuses.js : source unique
    ├── src/{routes,controllers,services,models,middlewares,validators,utils,docs}/   # vides
    ├── sql/seed.js           # mongosh autonome : base vide (collections + $jsonSchema + index), relançable ; exécutable sur Atlas (Compass > MONGOSH ou docker mongosh)
    ├── migration/seed-demo.js # mongosh autonome : structure (copie de sql/seed.js) + démo déterministe, comptes @helpup.test (mdp password123, hash bcrypt en dur) ; RESET=true ne touche que la démo ; pas de JWT
    ├── tests/health.test.js  # test Supertest de /api/health
    └── eslint.config.js      # CommonJS, globals node + jest   (plus de backend/.env : tout est dans le .env racine)
```
- Le backend est en CommonJS (`require`) pour éviter de configurer Jest en ESM. Le frontend est en ESM.
- Scripts du backend : `dev` (nodemon), `start`, `test` (`jest --runInBand`), `lint`.
- Scripts du frontend : `dev`, `build`, `lint`, `preview`.
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
- Nettoyage encore à faire : supprimer `frontend/.oxlintrc.json` (oxlint retiré) avant le commit initial. `setup-helpup.sh` n'existe plus.

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
- Un seul type de compte (pas de rôles/admin), localisation par liste fixe de quartiers, seul le flux candidatures change le statut d'une mission.

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
