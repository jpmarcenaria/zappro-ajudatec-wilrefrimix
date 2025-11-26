#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$ROOT/.preview.pid"
LOG_FILE="$ROOT/preview.log"

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🛑 ZapPRO Stop All Services          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# Stop Next.js
echo -e "${YELLOW}1️⃣  Parando Next.js...${NC}"
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if ps -p "$PID" > /dev/null 2>&1; then
    kill "$PID" 2>/dev/null && echo -e "${GREEN}   ✓ Next.js parado (PID: $PID)${NC}" || echo -e "${RED}   ✗ Erro ao parar${NC}"
    rm -f "$PID_FILE"
  else
    echo -e "${YELLOW}   ⚠️  Processo não encontrado${NC}"
    rm -f "$PID_FILE"
  fi
else
  echo -e "${YELLOW}   ⚠️  Next.js não está rodando${NC}"
fi

# Remove logs
if [ -f "$LOG_FILE" ]; then
  rm -f "$LOG_FILE"
  echo -e "${GREEN}   ✓ Logs removidos${NC}"
fi
echo ""

# Stop Docker Compose
echo -e "${YELLOW}2️⃣  Parando Supabase (Docker Compose)...${NC}"
cd "$ROOT"

if docker compose ps 2>/dev/null | grep -q "Up"; then
  docker compose down
  echo -e "${GREEN}   ✓ Supabase parado${NC}"
else
  echo -e "${YELLOW}   ⚠️  Supabase não está rodando${NC}"
fi
echo ""

# Summary
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      ✨ Todos os serviços parados!    ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Next.js: Parado${NC}"
echo -e "${GREEN}✅ Supabase: Parado${NC}"
echo -e "${GREEN}✅ Logs: Removidos${NC}"
echo ""
