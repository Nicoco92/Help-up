#!/usr/bin/env bash
# Installe le déploiement automatique sur le VPS (à lancer une fois, depuis ~/help-up) :
#   bash deploy/install.sh
# Désinstaller : sudo systemctl disable --now helpup-update.timer
set -euo pipefail
cd "$(dirname "$0")"

sudo cp helpup-update.service helpup-update.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now helpup-update.timer
systemctl list-timers helpup-update.timer --no-pager
