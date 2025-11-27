#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL_DIR="$ROOT/apps/saas/db"
FILE1="$SQL_DIR/vector.sql"
FILE2="$SQL_DIR/vector-full.sql"
if [ -f "$FILE1" ]; then docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f "$FILE1"; fi
if [ -f "$FILE2" ]; then docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f "$FILE2"; fi
