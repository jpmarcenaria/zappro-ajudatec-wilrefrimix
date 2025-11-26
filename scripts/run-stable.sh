#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/apps/saas"
LOG_FILE="$ROOT/preview.log"

trap 'echo -e "${YELLOW}🛑 Encerrando monitoramento...${NC}"' EXIT

echo -e "${BLUE}🚀 ZapPRO Stable Run${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}📋 Validando dependências...${NC}"
for cmd in node npm curl; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo -e "${RED}❌ Dependência ausente: $cmd${NC}"
    echo -e "${YELLOW}   Instale com: sudo apt install $cmd${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✅ Dependências OK${NC}"

if [ ! -d "$APP" ]; then
  echo -e "${RED}❌ Diretório não encontrado: $APP${NC}"
  exit 1
fi

echo -e "${YELLOW}🧹 Limpando processos anteriores...${NC}"
bash "$ROOT/scripts/stop-preview.sh" >/dev/null 2>&1 || true

cd "$APP"

if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}📦 Instalando dependências...${NC}"
  npm install
fi

PORT="${PORT:-3001}"
export PORT
export ALLOWED_ORIGIN="http://localhost:${PORT}"
export NEXT_PUBLIC_WEBSITE_URL="http://localhost:${PORT}"
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=development
export NODE_OPTIONS="--max-old-space-size=1024"

export NEXT_PUBLIC_FAKE_AUTH_EMAIL="${NEXT_PUBLIC_FAKE_AUTH_EMAIL:-test@test.com}"
export NEXT_PUBLIC_FAKE_AUTH_PASSWORD="${NEXT_PUBLIC_FAKE_AUTH_PASSWORD:-12345678A}"
export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-http://localhost:8000}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-anon-dev}"
# Se chaves externas estiverem definidas no ambiente, respeitar (não desativar):
# OPENAI_API_KEY e SUPABASE_SERVICE_ROLE_KEY

echo -e "${GREEN}✅ Iniciando servidor na porta ${PORT} (foreground)...${NC}"
echo -e "${YELLOW}⚠️  MANTENHA ESTE TERMINAL ABERTO!${NC}"
echo -e "${BLUE}🌐 O navegador abrirá automaticamente.${NC}"

(
  echo -e "${BLUE}📈 Monitorando http://localhost:${PORT}/ ...${NC}"
  while true; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/" 2>/dev/null || echo "0")
    ts=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$ts] GET / ${code}" >> "$LOG_FILE"
    sleep 5
  done
) & MONITOR_PID=$!

(
  for i in $(seq 1 60); do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PORT}/" 2>/dev/null || echo "")
    [ "$code" = "200" ] && break
    sleep 0.5
  done
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command "Start-Process http://localhost:${PORT}/" 2>/dev/null || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:${PORT}/" >/dev/null 2>&1 || true
  fi
  echo "PREVIEW_URL: http://localhost:${PORT}/"
) &

echo -e "${BLUE}📝 Logs em: ${LOG_FILE}${NC}"
if command -v stdbuf >/dev/null 2>&1; then
  stdbuf -oL -eL npm run dev 2>&1 | tee -a "$LOG_FILE"
else
  npm run dev 2>&1 | tee -a "$LOG_FILE"
fi

kill "$MONITOR_PID" >/dev/null 2>&1 || true
