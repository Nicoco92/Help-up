#!/usr/bin/env sh
# Exécute un script mongosh sur la base de MONGODB_URI (Atlas), sans installer mongosh :
# le shell vient de l'image Docker officielle mongo:7.0.
#
#   npm run db:create   → sql/seed.js           (base vide : collections, validation, index)
#   npm run db:demo     → migration/seed-demo.js (structure + données de démo)
#
# Variables lues dans le .env racine (ou un autre fichier via ENV_FILE=...).
set -eu

cd "$(dirname "$0")/.."                     # dossier backend/
SCRIPT="${1:?usage : scripts/mongosh.sh <fichier.js>}"
ENV_FILE="${ENV_FILE:-../.env}"

[ -f "$SCRIPT" ] || { echo "Script introuvable : backend/$SCRIPT" >&2; exit 1; }
[ -f "$ENV_FILE" ] || { echo "Fichier d'environnement introuvable : $ENV_FILE" >&2; exit 1; }

docker run --rm --env-file "$ENV_FILE" -v "$PWD:/scripts:ro" mongo:7.0 \
  sh -c '[ -n "$MONGODB_URI" ] || { echo "MONGODB_URI manquant dans le .env" >&2; exit 1; }
         mongosh "$MONGODB_URI" --quiet "/scripts/$1"' _ "$SCRIPT"
