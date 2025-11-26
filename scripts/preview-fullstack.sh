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
APP="$ROOT/apps/saas"
PID_FILE="$ROOT/.preview.pid"
LOG_FILE="$ROOT/preview.log"

trap 'rm -f "$PID_FILE"' EXIT

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🚀 ZapPRO Full Stack Preview         ║${NC}"
echo -e "${CYAN}║  (Supabase + Next.js)                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# Validate dependencies
echo -e "${YELLOW}📋 Validando dependências...${NC}"
for cmd in docker npm curl; do
  if ! command -v "$cmd" > /dev/null 2>&1; then
    echo -e "${RED}❌ Erro: $cmd não encontrado${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✅ Dependências OK${NC}"
echo ""

# Check if Docker Compose is running
echo -e "${YELLOW}🐳 Verificando Supabase (Docker Compose)...${NC}"
cd "$ROOT"

if docker compose ps 2>/dev/null | grep -q "Up"; then
  echo -e "${GREEN}✅ Supabase já está rodando${NC}"
else
  echo -e "${YELLOW}🚀 Iniciando Supabase...${NC}"
  docker compose up -d
  
  echo -e "${YELLOW}⏳ Aguardando Supabase iniciar (30s)...${NC}"
  sleep 5
  
  # Wait for PostgreSQL
  for i in $(seq 1 50); do
    if docker compose exec -T db pg_isready -U postgres 2>/dev/null | grep -q "accepting connections"; then
      echo -e "${GREEN}✅ PostgreSQL pronto!${NC}"
      break
    fi
    sleep 0.5
  done
  
  # Wait for Kong (API Gateway)
  for i in $(seq 1 50); do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 2>/dev/null | grep -q "200\|404"; then
      echo -e "${GREEN}✅ Kong (API Gateway) pronto!${NC}"
      break
    fi
    sleep 0.5
  done
  
  echo -e "${GREEN}✅ Supabase iniciado!${NC}"
  echo -e "${BLUE}   📊 Studio: http://localhost:3006${NC}"
  echo -e "${BLUE}   🔌 API: http://localhost:8000${NC}"
fi
echo ""

# Environment variables
PORT="${PORT:-3001}"
export ALLOWED_ORIGIN="http://localhost:$PORT"
export NEXT_PUBLIC_WEBSITE_URL="http://localhost:$PORT"
export NEXT_PUBLIC_SUPABASE_URL="http://localhost:8000"
export PORT

echo -e "${BLUE}🌐 Configuração:${NC}"
echo -e "${BLUE}   App: http://localhost:$PORT${NC}"
echo -e "${BLUE}   Supabase: http://localhost:8000${NC}"
echo ""

# Check if app port is already listening
IS_LISTENING=0

if command -v ss > /dev/null 2>&1; then
  if ss -ltn 2>/dev/null | grep -qE ":${PORT}\s"; then
    IS_LISTENING=1
  fi
fi

if [ "$IS_LISTENING" -eq 0 ]; then
  if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null | grep -q 200; then
    IS_LISTENING=1
  fi
fi

# Start Next.js server
if [ "$IS_LISTENING" -eq 0 ]; then
  echo -e "${YELLOW}🚀 Iniciando Next.js...${NC}"
  
  cd "$APP"
  
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules não encontrado. Instalando...${NC}"
    npm install
  fi
  
  nohup npm run dev > "$LOG_FILE" 2>&1 &
  NPM_PID=$!
  echo "$NPM_PID" > "$PID_FILE"
  echo -e "${GREEN}   ✓ Next.js iniciado (PID: $NPM_PID)${NC}"
else
  echo -e "${GREEN}✅ Next.js já está rodando${NC}"
fi
echo ""

# Wait for Next.js
echo -e "${YELLOW}⏳ Aguardando Next.js responder...${NC}"
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null || echo "")
  
  if [ "$code" = "200" ]; then
    echo -e "${GREEN}✅ Next.js pronto! (${ATTEMPT}s)${NC}"
    break
  fi
  
  if [ $((ATTEMPT % 20)) -eq 0 ] && [ $ATTEMPT -gt 0 ]; then
    echo -e "${YELLOW}   ⏳ Ainda aguardando... (${ATTEMPT}/60)${NC}"
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  sleep 0.25
done

if [ "$code" != "200" ]; then
  echo -e "${RED}❌ Timeout: Next.js não respondeu${NC}"
  exit 1
fi
echo ""

# Health checks
echo -e "${YELLOW}🏥 Executando health checks...${NC}"

# Check Supabase
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 2>/dev/null | grep -q "200\|404"; then
  echo -e "${GREEN}✅ Supabase API: OK${NC}"
else
  echo -e "${RED}❌ Supabase API: FALHOU${NC}"
fi

# Check Next.js API
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/health" 2>/dev/null | grep -q "200"; then
  echo -e "${GREEN}✅ Next.js API: OK${NC}"
else
  echo -e "${YELLOW}⚠️  Next.js API: Não disponível (pode ser normal)${NC}"
fi

# Check Studio
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3006 2>/dev/null | grep -q "200"; then
  echo -e "${GREEN}✅ Supabase Studio: OK${NC}"
else
  echo -e "${YELLOW}⚠️  Supabase Studio: Não disponível${NC}"
fi
echo ""

# Open browser
echo -e "${YELLOW}🌐 Abrindo navegador...${NC}"
if command -v wslview > /dev/null 2>&1; then
  # WSL2 com wslview
  wslview "http://localhost:$PORT/" 2>/dev/null &
  echo -e "${GREEN}✅ Navegador aberto (wslview)${NC}"
elif command -v powershell.exe > /dev/null 2>&1; then
  # WSL com PowerShell
  powershell.exe -NoProfile -Command "Start-Process http://localhost:$PORT/" 2>/dev/null || true
  echo -e "${GREEN}✅ Navegador aberto (PowerShell)${NC}"
elif command -v xdg-open > /dev/null 2>&1; then
  # Linux nativo
  xdg-open "http://localhost:$PORT/" 2>/dev/null &
  echo -e "${GREEN}✅ Navegador aberto (xdg-open)${NC}"
else
  echo -e "${YELLOW}⚠️  Abra manualmente: http://localhost:$PORT/${NC}"
fi
echo ""

# Final summary
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         ✨ Stack Completo Pronto!     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 URLs Disponíveis:${NC}"
echo -e "${BLUE}   📱 App:           http://localhost:$PORT${NC}"
echo -e "${BLUE}   🔌 Supabase API:  http://localhost:8000${NC}"
echo -e "${BLUE}   📊 Studio:        http://localhost:3006${NC}"
echo -e "${BLUE}   🗄️  PostgreSQL:    localhost:5432${NC}"
echo ""
echo -e "${YELLOW}📝 Logs e Controle:${NC}"
echo -e "${BLUE}   Logs Next.js:  tail -f $LOG_FILE${NC}"
echo -e "${BLUE}   Logs Docker:   docker compose logs -f${NC}"
if [ -f "$PID_FILE" ]; then
  echo -e "${BLUE}   PID Next.js:   $(cat "$PID_FILE")${NC}"
fi
echo ""
echo -e "${YELLOW}🛑 Para parar tudo:${NC}"
echo -e "${BLUE}   make stop-all${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
