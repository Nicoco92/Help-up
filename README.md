# HelpUP

Application de mini-jobs entre voisins (workshop Full Stack JS, Efrei M1).
Stack : **TypeScript** (accord du formateur), React 19 + Vite, Express 5, MongoDB + Mongoose, Docker Compose.

## Installation sur un nouveau PC

À faire une seule fois par machine.

### 1. Prérequis

| Outil | Pourquoi | Vérifier |
|---|---|---|
| Git | cloner le projet | `git --version` |
| Docker Desktop (ou Docker Engine + Compose v2) | lancer Mongo, l'API et le front | `docker compose version` |
| Node.js 22 | lint, tests et autocomplétion dans l'éditeur (hors Docker) | `node -v` |
| openssl | générer les mots de passe | `openssl version` |

Sous Windows, travailler dans WSL2 (Ubuntu) : les commandes ci-dessous sont pour Linux, macOS et WSL.

### 2. Cloner le projet

```bash
git clone https://github.com/Nicoco92/Help-up.git
cd Help-up
```

### 3. Créer les fichiers de secrets

Le projet a **un seul** fichier d'environnement : `.env` à la racine (MongoDB, JWT, CORS, mongo-express et l'URL de l'API pour le front).
Il n'est jamais dans Git : chacun crée le sien à partir de `.env.example`.

> Toute variable qui commence par `VITE_` est envoyée au navigateur et visible par tout le monde. Ne jamais préfixer un secret par `VITE_`.

Ces commandes copient le modèle et remplacent les `change-me` par des valeurs aléatoires :

```bash
# Secrets serveur (MongoDB, JWT, mongo-express)
cp .env.example .env
for v in MONGO_ROOT_PASSWORD MONGO_APP_PASSWORD ME_PASSWORD; do
  sed -i "s/^$v=.*/$v=$(openssl rand -hex 24)/" .env
done
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$(openssl rand -hex 32)/" .env
```

Sur macOS, remplacer `sed -i` par `sed -i ''`.
Docker Compose ne transmet à chaque conteneur que ses propres variables : le backend reçoit `JWT_*`, `CORS_ORIGIN`, `PORT` et l'URI Mongo du compte applicatif (jamais le mot de passe administrateur), le frontend reçoit seulement `VITE_API_URL`.
On peut aussi copier les fichiers et remplacer les `change-me` à la main ; dans ce cas, utiliser des valeurs hexadécimales (`openssl rand -hex 24`) : elles vont dans une URI Mongo, où `@`, `:` ou `/` casseraient la connexion.

Chaque PC a ses propres mots de passe : ne pas se les envoyer entre membres du groupe.

### 4. Installer les dépendances en local (facultatif)

Docker installe ses propres dépendances. Cette étape sert seulement à l'éditeur, au lint et aux tests :

```bash
(cd backend && npm install)
(cd frontend && npm install)
```

### 5. Lancer et vérifier

```bash
docker compose up -d
curl localhost:3000/api/health   # doit renvoyer {"status":"ok"}
```

Le premier lancement prend une à deux minutes (téléchargement des images, `npm install` dans les conteneurs). Ouvrir ensuite http://localhost:5173.

## Usage quotidien

```bash
docker compose up -d       # démarrer
docker compose logs -f backend   # suivre les logs de l'API
docker compose down        # arrêter (les données sont gardées)
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/api/health |
| Documentation de l'API (Swagger) | http://localhost:3000/api/docs |
| MongoDB (Compass, mongosh) | `127.0.0.1:27017` (authentification obligatoire) |

Interface d'admin mongo-express sur http://localhost:8081, identifiants `ME_USER` / `ME_PASSWORD` du `.env` :

```bash
docker compose --profile tools up -d
```

Vérifications (dans `backend/` ou `frontend/`) : `npm run typecheck` (types TypeScript), `npm run lint`, `npm test` (backend), `npm run build`.

## Base de données : structure et données de démo

Deux scripts **mongosh** autonomes (aucune dépendance), exécutables directement sur Atlas :

| Fichier | Effet |
|---|---|
| `backend/sql/seed.js` | Crée la base **vide** : collections `users`, `missions`, `applications`, `reviews`, `notifications`, `messages`, règles de validation et index. Ne supprime rien, peut être relancé |
| `backend/migration/seed-demo.js` | Crée la base (même structure) **puis** insère 15 comptes, 32 missions, une quarantaine de candidatures, des avis, des notifications et 6 messages privés. Si la démo existe déjà, n'insère rien, sauf avec `RESET = true` en haut de la partie 2 : seuls les comptes `@helpup.test` et ce qui leur est lié sont alors remplacés |

**Lancer sur Atlas en une commande** (Docker fournit mongosh, `MONGODB_URI` est lu dans le fichier d'environnement racine) :

```bash
cd backend
npm run db:demo     # structure + données de démo
npm run db:create   # ou : seulement la base vide
```

Si une base au nom proche existe déjà avec une autre casse (par exemple `HelpUP`), la commande s'arrête sans rien modifier : MongoDB refuse `helpup` et `HelpUP` côte à côte. Vérifier avec l'équipe, supprimer l'ancienne base, relancer.

Autre possibilité : **Compass** (ou un playground de l'extension MongoDB pour VS Code) connecté à Atlas, en collant le contenu du fichier.

L'interface web d'Atlas (Data Explorer) ne sait pas exécuter de script : passer par Compass ou mongosh.

Comptes de démo (mot de passe `password123`) :

| Compte | Rôle dans la démo |
|---|---|
| `alice.martin@helpup.test` | Publie des missions : une ouverte avec 3 candidats à accepter, une attribuée (conversation avec Chloé, 1 message non lu), une terminée avec avis (conversation avec Bob, en lecture seule) |
| `bob.nguyen@helpup.test` | Étudiant : candidatures en attente, refusée, et une mission terminée |
| `chloe.diallo@helpup.test` | Publie **et** postule ; prestataire du déménagement d'Alice (messagerie) |

> La base Atlas est **partagée** par l'équipe : prévenir les autres avant un `RESET = true`.
> Détail des collections, contraintes et index : [docs/modele-donnees.md](docs/modele-donnees.md).

## Sécurité de la base

- MongoDB exige une authentification. Le backend utilise un compte limité à la base `helpup` (`readWrite`), jamais le compte administrateur.
- Ces comptes sont créés **au premier démarrage seulement** (volume vide). Après un changement d'identifiants dans `.env`, recréer le volume, ce qui **efface les données** :

  ```bash
  docker compose down -v
  ```

- MongoDB et mongo-express ne sont accessibles que depuis la machine locale (`127.0.0.1`).
- En production : ne pas publier le port de MongoDB, ne pas déployer mongo-express, générer de nouveaux mots de passe.

## Problèmes connus

- **`failed to connect to the docker API ... docker.sock`** : Docker Desktop n'est pas lancé (sous Linux : `systemctl --user start docker-desktop`).
- **`port is already allocated`** : un autre programme utilise déjà ce port sur la machine. Le plus souvent, un autre MongoDB tourne déjà sur 27017 : l'arrêter (`docker ps` pour le trouver, puis `docker stop <nom>`), ou changer le port de gauche dans `compose.yaml` (ex. `"127.0.0.1:27020:27017"`) sans commiter ce changement.
- **`required variable ... is missing`** : le `.env` racine manque ou est incomplet (étape 3).
- **Le backend redémarre en boucle avec `Authentication failed`** : les mots de passe du `.env` ne correspondent plus à ceux créés dans le volume. Faire `docker compose down -v` puis `docker compose up -d`.
- **Pourquoi `mongo:7.0` et pas 8** : MongoDB 8 refuse de démarrer sur les noyaux Linux 6.19.0 à 7.0.13 (`known incompatibility`), dont celui de la VM Docker Desktop. On pourra repasser en 8 après une mise à jour de Docker Desktop.

## Documentation

- [Contrat de l'API](backend/src/api/openapi/README.md) (OpenAPI 3, dossier `backend/src/api/openapi/` : une ressource par fichier) : servi en interface Swagger sur http://localhost:3000/api/docs et en JSON sur `/api/docs/openapi.json`. Le bouton « Authorize » permet de coller un JWT pour tester les routes protégées. Les routes pas encore codées sont marquées « à implémenter » (`x-status: todo`).
- [Plan de développement](docs/plan-features.md) : répartition des features, contrat d'API, dépendances et diagramme de Gantt.
- [Modèle de données](docs/modele-donnees.md) : User, Mission, Application, Review (champs, contraintes, index, cycle de vie, scripts).
- [Sécurité](docs/securite.md) : audit OWASP de bout en bout (modèle de menace, constats et corrections, risques acceptés, recommandations de déploiement), vérifié par `npm test -- security`.
- [Charte graphique](docs/charte-graphique.md) : couleurs (clair et sombre), typographie, composants, carte, ton éditorial et variables CSS.
