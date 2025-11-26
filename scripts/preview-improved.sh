#!/usr/bin/env bash
set -euo pipefail  # Strict mode: exit on error, undefined vars, pipe failures

# Colors for better UX
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect directories
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/apps/saas"
PID_FILE="$ROOT/.preview.pid"

# Cleanup on exit
trap 'rm -f "$PID_FILE"' EXIT

echo -e "${BLUE}🔧 ZapPRO Preview Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Validate dependencies
echo -e "${YELLOW}📋 Validando dependências...${NC}"
for cmd in npm curl; do
  if ! command -v "$cmd" > /dev/null 2>&1; then
    echo -e "${RED}❌ Erro: $cmd não encontrado${NC}"
    echo -e "${YELLOW}   Instale com: sudo apt install $cmd${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✅ Dependências OK${NC}"

# Validate directory
if [ ! -d "$APP" ]; then
  echo -e "${RED}❌ Erro: Diretório $APP não encontrado${NC}"
  exit 1
fi

cd "$APP"

# Environment variables (allow override via env)
PORT="${PORT:-3001}"
export ALLOWED_ORIGIN="http://localhost:$PORT"
export NEXT_PUBLIC_WEBSITE_URL="http://localhost:$PORT"
export PORT

echo -e "${BLUE}🌐 Porta: $PORT${NC}"

# Check if port is already listening
IS_LISTENING=0

# Method 1: Check with ss (more reliable)
if command -v ss > /dev/null 2>&1; then
  if ss -ltn 2>/dev/null | grep -qE ":${PORT}\s"; then
    IS_LISTENING=1
    echo -e "${GREEN}✅ Porta $PORT já está em uso${NC}"
  fi
fi

# Method 2: Fallback to HTTP check
if [ "$IS_LISTENING" -eq 0 ]; then
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null | grep -q 200; then
    IS_LISTENING=1
    echo -e "${GREEN}✅ Servidor já está respondendo${NC}"
  fi
fi

# Start server if not running
if [ "$IS_LISTENING" -eq 0 ]; then
  echo -e "${YELLOW}🚀 Iniciando servidor Next.js...${NC}"
  
  # Check if node_modules exists
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules não encontrado. Executando npm install...${NC}"
    npm install
  fi
  
  # Start server in background
  nohup npm run dev > "$ROOT/preview.log" 2>&1 &
  NPM_PID=$!
  echo "$NPM_PID" > "$PID_FILE"
  echo -e "${GREEN}   ✓ Servidor iniciado (PID: $NPM_PID)${NC}"
  echo -e "${BLUE}   ℹ Logs: $ROOT/preview.log${NC}"
else
  echo -e "${GREEN}✅ Usando servidor existente${NC}"
fi

# Wait for server to be ready
echo -e "${YELLOW}⏳ Aguardando servidor responder...${NC}"
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null || echo "")
  
  if [ "$code" = "200" ]; then
    echo -e "${GREEN}✅ Servidor pronto! (${ATTEMPT}s)${NC}"
    break
  fi
  
  # Show progress every 5 attempts
  if [ $((ATTEMPT % 20)) -eq 0 ] && [ $ATTEMPT -gt 0 ]; then
    echo -e "${YELLOW}   ⏳ Ainda aguardando... (${ATTEMPT}/60)${NC}"
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  sleep 0.25
done

# Validate server started
if [ "$code" != "200" ]; then
  echo -e "${RED}❌ Timeout: Servidor não respondeu em 15s${NC}"
  echo -e "${YELLOW}   Verifique logs em: $ROOT/preview.log${NC}"
  
  # Show last 10 lines of log if exists
  if [ -f "$ROOT/preview.log" ]; then
    echo -e "${YELLOW}   Últimas linhas do log:${NC}"
    tail -n 10 "$ROOT/preview.log"
  fi
  
  exit 1
fi

# Open browser (WSL → Windows)
echo -e "${YELLOW}🌐 Abrindo navegador...${NC}"
if command -v powershell.exe > /dev/null 2>&1; then
  if powershell.exe -NoProfile -Command "Start-Process http://localhost:$PORT/" 2>/dev/null; then
    echo -e "${GREEN}✅ Navegador aberto${NC}"
  else
    echo -e "${YELLOW}⚠️  Não foi possível abrir o navegador automaticamente${NC}"
    echo -e "${BLUE}   Abra manualmente: http://localhost:$PORT/${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  powershell.exe não encontrado (não está no WSL?)${NC}"
  echo -e "${BLUE}   Abra manualmente: http://localhost:$PORT/${NC}"
fi

# Final message
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Preview pronto!${NC}"
echo -e "${BLUE}📍 URL: http://localhost:$PORT/${NC}"
echo -e "${BLUE}📝 Logs: $ROOT/preview.log${NC}"
if [ -f "$PID_FILE" ]; then
  echo -e "${BLUE}🔧 PID: $(cat "$PID_FILE")${NC}"
  echo -e "${YELLOW}💡 Para parar: kill \$(cat $PID_FILE)${NC}"
fi
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━${NC}"
