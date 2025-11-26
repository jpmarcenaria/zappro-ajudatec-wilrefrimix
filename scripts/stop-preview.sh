#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$ROOT/.preview.pid"

echo -e "${BLUE}🛑 ZapPRO Stop Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
  echo -e "${YELLOW}⚠️  Nenhum servidor preview encontrado${NC}"
  echo -e "${BLUE}   (Arquivo $PID_FILE não existe)${NC}"
  exit 0
fi

# Read PID
PID=$(cat "$PID_FILE")

# Check if process is running
if ! ps -p "$PID" > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Processo $PID não está rodando${NC}"
  rm -f "$PID_FILE"
  exit 0
fi

# Kill process
echo -e "${YELLOW}🔪 Parando servidor (PID: $PID)...${NC}"
if kill "$PID" 2>/dev/null; then
  echo -e "${GREEN}✅ Servidor parado${NC}"
  rm -f "$PID_FILE"
  
  # Also remove log file
  if [ -f "$ROOT/preview.log" ]; then
    rm -f "$ROOT/preview.log"
    echo -e "${GREEN}✅ Log removido${NC}"
  fi
else
  echo -e "${RED}❌ Erro ao parar servidor${NC}"
  echo -e "${YELLOW}   Tente manualmente: kill $PID${NC}"
  exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Servidor parado com sucesso!${NC}"
