#!/bin/bash
set -e

# i2k Deployment Script
# Usage: ./deploy.sh [--first-run]

APP_DIR="/opt/apps/i2k"
REPO_URL="https://github.com/besercer/i2k.git"

echo "=== i2k Deployment ==="
echo ""

# Check if first run
if [ "$1" == "--first-run" ]; then
    echo "[1/6] Erste Installation - Erstelle Verzeichnisse..."
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"

    echo "[2/6] Klone Repository..."
    git clone "$REPO_URL" "$APP_DIR/repo"

    echo "[3/6] Erstelle .env Datei..."
    cd "$APP_DIR/repo/deploy"
    if [ ! -f .env ]; then
        cp .env.example .env
        # Generate secure password
        POSTGRES_PW=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
        sed -i "s/GENERATE_SECURE_PASSWORD_HERE/$POSTGRES_PW/" .env
        echo ""
        echo "WICHTIG: Bearbeite $APP_DIR/repo/deploy/.env und setze OPENAI_API_KEY!"
        echo ""
    fi

    echo "[4/6] SSL-Zertifikat anfordern..."
    sudo certbot certonly --nginx -d i2k.schaper-style.de --non-interactive --agree-tos

    echo "[5/6] Nginx-Konfiguration einrichten..."
    sudo cp nginx-i2k.conf /etc/nginx/sites-available/i2k.conf
    sudo ln -sf /etc/nginx/sites-available/i2k.conf /etc/nginx/sites-enabled/i2k.conf
    sudo nginx -t && sudo systemctl reload nginx

    echo "[6/6] Docker-Container starten..."
    docker compose -f docker-compose.prod.yml build
    docker compose -f docker-compose.prod.yml up -d

    echo ""
    echo "=== Erste Installation abgeschlossen ==="
    echo "Deine App sollte unter https://i2k.schaper-style.de erreichbar sein."
    echo ""
    echo "Vergiss nicht, OPENAI_API_KEY in $APP_DIR/repo/deploy/.env zu setzen!"

else
    echo "[1/3] Ziehe neueste Änderungen..."
    cd "$APP_DIR/repo"
    git pull origin main

    echo "[2/3] Baue Docker-Images neu..."
    cd deploy
    docker compose -f docker-compose.prod.yml build

    echo "[3/3] Starte Container neu..."
    docker compose -f docker-compose.prod.yml up -d

    echo ""
    echo "=== Update abgeschlossen ==="
fi

echo "Status der Container:"
docker compose -f docker-compose.prod.yml ps
