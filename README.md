# HelpUP

Application de mini-jobs entre voisins (workshop Full Stack JS, Efrei M1).
Stack : React 19 + Vite, Express 5, MongoDB + Mongoose, Docker Compose.

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

Les `.env` ne sont jamais dans Git : chacun crée les siens à partir des modèles `.env.example`.
Ces commandes copient les modèles et remplacent les `change-me` par des valeurs aléatoires :

```bash
# Secrets Docker (MongoDB, mongo-express)
cp .env.example .env
for v in MONGO_ROOT_PASSWORD MONGO_APP_PASSWORD ME_PASSWORD; do
  sed -i "s/^$v=.*/$v=$(openssl rand -hex 24)/" .env
done

# Backend (JWT)
cp backend/.env.example backend/.env
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$(openssl rand -hex 32)/" backend/.env

# Frontend (URL de l'API, pas de secret)
cp frontend/.env.example frontend/.env
```

Sur macOS, remplacer `sed -i` par `sed -i ''`.
Le `change-me` restant dans `MONGODB_URI` de `backend/.env` est normal : sous Docker, cette valeur est remplacée par celle de `compose.yaml`. Elle ne sert que pour lancer l'API sans Docker.
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
| MongoDB (Compass, mongosh) | `127.0.0.1:27017` (authentification obligatoire) |

Interface d'admin mongo-express sur http://localhost:8081, identifiants `ME_USER` / `ME_PASSWORD` du `.env` :

```bash
docker compose --profile tools up -d
```

Lint et tests (dans `backend/` ou `frontend/`) : `npm run lint`, `npm test` (backend).

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
