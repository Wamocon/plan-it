#!/bin/bash
# Lokale Entwicklungsumgebung starten
set -e

echo "🐳 Starte a-plan lokale Entwicklungsumgebung..."
docker compose up -d

echo ""
echo "⏳ Warte auf PostgreSQL..."
until docker exec a-plan_db pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

echo ""
echo "✅ Alles läuft!"
echo ""
echo "  📦 PostgreSQL  → localhost:5432"
echo "     User:       postgres"
echo "     Passwort:   postgres"
echo "     Datenbank:  a-plan"
echo ""
echo "  🖥️  pgAdmin     → http://localhost:5050"
echo "     Login:      admin@local.dev / admin"
echo "     (Verbindung 'a-plan (local)' ist voreingestellt)"
echo ""
echo "  🛑 Zum Stoppen: docker compose down"
echo "  🗑️  Mit Datenlöschung: docker compose down -v"
