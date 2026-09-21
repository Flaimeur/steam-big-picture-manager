#!/usr/bin/env bash
# Steam Big Picture Manager - Launcher Linux / SteamOS / macOS
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Vérifier si python3 est disponible
if command -v python3 &>/dev/null; then
    exec python3 run_app.py "$@"
elif command -v python &>/dev/null; then
    exec python run_app.py "$@"
else
    echo "Erreur: Python 3 est requis pour executer Steam Big Picture Manager."
    exit 1
fi
