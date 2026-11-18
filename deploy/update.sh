#!/usr/bin/env bash
# Déploiement continu de HelpUP sur le VPS.
# Lancé chaque minute par helpup-update.timer : si origin/main a un nouveau commit,
# met le dépôt à jour, reconstruit les images et relance les conteneurs (compose.yaml).
#
#   deploy/update.sh           ne fait rien si le dépôt est déjà à jour
#   deploy/update.sh --force   reconstruit et relance quand même (premier passage en prod)
#
# Journal : journalctl -u helpup-update -f
# Ne touche jamais aux volumes (pas de `down -v`) : la base mongo-data est conservée.

set -euo pipefail

# Tout est dans une fonction : bash la lit en entier avant de l'exécuter,
# donc le `git merge` qui réécrit ce fichier ne perturbe pas l'exécution en cours.
main() {
    local repo_dir branch
    repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    branch="${DEPLOY_BRANCH:-main}"
    cd "$repo_dir"

    # Un seul déploiement à la fois (un build peut durer plus d'une minute)
    exec 9>"$repo_dir/.git/helpup-update.lock"
    if ! flock -n 9; then
        echo "Déploiement déjà en cours, on passe."
        return 0
    fi

    if [ "$(git rev-parse --abbrev-ref HEAD)" != "$branch" ]; then
        echo "ERREUR : le dépôt n'est pas sur la branche $branch." >&2
        return 1
    fi

    git fetch --quiet origin "$branch"
    local current target
    current="$(git rev-parse HEAD)"
    target="$(git rev-parse "origin/$branch")"

    if [ "$current" = "$target" ] && [ "${1:-}" != "--force" ]; then
        return 0
    fi

    # Les fichiers suivis ne doivent pas être modifiés à la main sur le serveur (.env est ignoré par git)
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo "ERREUR : modifications locales sur le serveur, déploiement annulé :" >&2
        git status --short >&2
        return 1
    fi

    if [ "$current" != "$target" ]; then
        echo "Mise à jour ${current:0:7} → ${target:0:7}"
        git log --oneline "$current..$target"
        git merge --ff-only --quiet "origin/$branch"
    fi

    # Les images sont construites avant de remplacer les conteneurs :
    # si le build échoue, l'ancienne version continue de tourner.
    docker compose up -d --build --remove-orphans

    # Vérification de bout en bout (nginx → API → Mongo)
    local i
    for i in $(seq 1 30); do
        if curl -fsS --max-time 5 http://127.0.0.1:5173/api/health >/dev/null 2>&1; then
            echo "Déployé : $(git log -1 --format='%h %s')"
            docker image prune -f >/dev/null
            return 0
        fi
        sleep 2
    done

    echo "ERREUR : /api/health ne répond pas après le déploiement." >&2
    docker compose ps >&2
    docker compose logs --tail 30 backend frontend >&2
    return 1
}

main "$@"
